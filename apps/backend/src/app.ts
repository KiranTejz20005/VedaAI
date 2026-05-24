import 'express-async-errors';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { QueueEvents } from 'bullmq';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/db';
import { closeRedis, closeBullRedis, getBullRedisClient, getBullRedisDiagnostics, getRedisClient, isBullRedisConnected, isRedisConnected } from './config/redis';
import { initializeSocketServer, getSocketServer } from './sockets/socket.server';
import { createAiGenerationWorker, getActiveAiJobCount, getStalledAiJobCount } from './workers/aiGeneration.worker';
import { createPdfWorker } from './workers/pdf.worker';
import { GenerationJob } from './models/GenerationJob.model';
import { Assignment } from './models/Assignment.model';
import { emitToAssignment } from './sockets/socket.server';
import apiRouter from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { logger } from './utils/logger';

// ── Bootstrap phase tracking ──
let isBootstrapping = false;
let bootstrapPhase = 'init';
const healthState = { db: 'disconnected', redis: 'disconnected', bullmqRedis: 'disconnected', workers: 'none' };
let queueTimeoutMonitor: NodeJS.Timeout | null = null;
let stallMonitorInterval: NodeJS.Timeout | null = null;
let generationQueueEvents: QueueEvents | null = null;
let pdfQueueEvents: QueueEvents | null = null;

const QUEUE_TIMEOUT_MS = 2 * 60 * 1000;
const QUEUE_SWEEP_INTERVAL_MS = env.QUEUE_SWEEP_INTERVAL_MS;
const IN_PROGRESS_STUCK_TIMEOUT_MS = 10 * 60 * 1000;
const STALL_MONITOR_INTERVAL_MS = env.STALL_MONITOR_INTERVAL_MS;

function logBoot(phase: string, message: string) {
  bootstrapPhase = phase;
  logger.info(`[BOOT:${phase}] ${message}`);
}

process.on('uncaughtException', (error) => {
  logger.error(`[FATAL:uncaughtException] ${error.message}`);
  if (error.stack) logger.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`[FATAL:unhandledRejection] ${String(reason)}`);
  if (reason instanceof Error && reason.stack) logger.error(reason.stack);
  process.exit(1);
});

function parseCorsOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\/+$/, ''));
}

async function failStaleQueuedJobs(): Promise<void> {
  const cutoff = new Date(Date.now() - QUEUE_TIMEOUT_MS);
  const staleJobs = await GenerationJob.find({
    status: 'queued',
    createdAt: { $lte: cutoff },
  }).sort({ createdAt: 1 }).limit(25).lean();

  for (const job of staleJobs) {
    const assignmentId = job.assignmentId.toString();

    await Promise.allSettled([
      Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' }),
      GenerationJob.findByIdAndUpdate(job._id, {
        status: 'failed',
        error: 'Generation timed out while waiting in queue',
        completedAt: new Date(),
      }),
    ]);

    emitToAssignment(assignmentId, 'generation:failed', {
      assignmentId,
      error: 'Generation timed out while waiting in queue',
      retryable: true,
      jobRecordId: job._id.toString(),
      generationSeq: job.generationSeq ?? 0,
      version: job.progressVersion ?? 0,
      ts: Date.now(),
    });

    logger.warn(`Generation job ${job._id.toString()} timed out in queue and was marked failed`);
  }
}

async function failStaleInProgressJobs(): Promise<void> {
  const cutoff = new Date(Date.now() - IN_PROGRESS_STUCK_TIMEOUT_MS);
  const staleJobs = await GenerationJob.find({
    status: { $in: ['extracting_content', 'topic_preprocessing', 'generation_planning', 'batch_generating', 'validating', 'answer_key_generating', 'pdf_composing', 'persisting', 'pdf-generating'] },
    updatedAt: { $lte: cutoff },
  }).sort({ updatedAt: 1 }).limit(25).lean();

  for (const job of staleJobs) {
    const assignmentId = job.assignmentId.toString();

    await Promise.allSettled([
      Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' }),
      GenerationJob.findByIdAndUpdate(job._id, {
        status: 'failed',
        error: 'Generation appears stuck and was automatically failed',
        completedAt: new Date(),
      }),
    ]);

    emitToAssignment(assignmentId, 'generation:failed', {
      assignmentId,
      error: 'Generation appears stuck and was automatically failed',
      retryable: true,
      jobRecordId: job._id.toString(),
      generationSeq: job.generationSeq ?? 0,
      version: job.progressVersion ?? 0,
      ts: Date.now(),
    });

    logger.warn(`Generation job ${job._id.toString()} was stale in-progress and marked failed`);
  }
}

async function initializeWorkers() {
  healthState.workers = 'starting';

  try {
    healthState.bullmqRedis = 'connecting';
    createAiGenerationWorker();
    createPdfWorker();
    healthState.bullmqRedis = 'connected';
    healthState.workers = 'running';
    logger.info('[WORKERS] AI + PDF workers created');

    const bullConnection = getBullRedisClient();
    generationQueueEvents = new QueueEvents('generation', {
      connection: bullConnection,
      skipVersionCheck: true,
    });
    pdfQueueEvents = new QueueEvents('pdf', {
      connection: bullConnection,
      skipVersionCheck: true,
    });

    generationQueueEvents.on('completed', ({ jobId }) => logger.info(`[QUEUE:generation] completed jobId=${jobId}`));
    generationQueueEvents.on('failed', ({ jobId, failedReason }) => logger.warn(`[QUEUE:generation] failed jobId=${jobId} reason=${failedReason}`));
    generationQueueEvents.on('stalled', ({ jobId }) => logger.error(`[QUEUE:generation] STALLED jobId=${jobId}`));

    pdfQueueEvents.on('completed', ({ jobId }) => logger.info(`[QUEUE:pdf] completed jobId=${jobId}`));
    pdfQueueEvents.on('failed', ({ jobId, failedReason }) => logger.warn(`[QUEUE:pdf] failed jobId=${jobId} reason=${failedReason}`));

    logger.info('[WORKERS] Queue events initialized');
  } catch (error) {
    healthState.workers = 'failed';
    healthState.bullmqRedis = 'error';
    logger.error(`[WORKERS] Failed to initialize: ${error instanceof Error ? error.message : error}`);
    if (env.NODE_ENV === 'production') {
      logger.error('[WORKERS] Workers failed in production — exiting');
      process.exit(1);
    }
  }
}

async function startBackgroundWorkers() {
  logBoot('workers', 'Starting background workers...');
  await initializeWorkers();

  // Queue timeout watchdog
  queueTimeoutMonitor = setInterval(() => {
    void Promise.all([
      failStaleQueuedJobs(),
      failStaleInProgressJobs(),
    ]).catch((e) => logger.error('[WATCHDOG] Sweep failed:', e));
  }, QUEUE_SWEEP_INTERVAL_MS);
  void Promise.all([
    failStaleQueuedJobs(),
    failStaleInProgressJobs(),
  ]).catch((e) => logger.error('[WATCHDOG] Initial sweep failed:', e));

  // Stall monitor
  stallMonitorInterval = setInterval(() => {
    const diag = getBullRedisDiagnostics();
    logger.info(
      `[STALL] redis=${diag.status} connects=${diag.connectCount} reconnects=${diag.reconnectCount} errors=${diag.errorCount} stalled=${getStalledAiJobCount()} active=${getActiveAiJobCount()}`
    );
  }, STALL_MONITOR_INTERVAL_MS);

  logBoot('workers', 'Background workers ready');
}

function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  const corsOrigins = parseCorsOrigins(env.FRONTEND_URL);
  const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    ...corsOrigins,
  ];

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(compression());

  const corsMiddleware = cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/+$/, '');
      let allowed = ALLOWED_ORIGINS.includes(normalizedOrigin);
      if (!allowed) {
        try {
          const hostname = new URL(normalizedOrigin).hostname;
          allowed = /^vedaai[\w-]*\.vercel\.app$/i.test(hostname);
        } catch {
          allowed = false;
        }
      }
      if (!allowed) {
        logger.warn(`[CORS] Blocked origin: ${normalizedOrigin}`);
      }
      callback(null, allowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.use(corsMiddleware);
  app.options('*', corsMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
  });
  app.use('/api', limiter);

  app.use('/api', apiRouter);

  return app;
}

async function bootstrap() {
  if (isBootstrapping) {
    logger.warn('[BOOT] Bootstrap already running — skipping');
    return;
  }
  isBootstrapping = true;
  logBoot('init', `Starting backend — mode=${env.RENDER_WORKER_MODE}, env=${env.NODE_ENV}`);

  // ── Step 1: Connect to MongoDB (fail fast) ──
  logBoot('mongodb', 'Connecting to MongoDB...');
  try {
    await connectDatabase();
    healthState.db = 'connected';
    logBoot('mongodb', 'Connected successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    healthState.db = 'error';
    logger.error(`[BOOT:mongodb] Connection failed: ${message}`);
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  // ── Step 2: Connect to Redis (fail fast) ──
  logBoot('redis', 'Connecting to Redis...');
  try {
    const generalRedis = getRedisClient();
    const bullRedis = getBullRedisClient();
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const onReady = () => { generalRedis.removeListener('error', onError); resolve(); };
        const onError = (err: Error) => { generalRedis.removeListener('ready', onReady); reject(err); };
        generalRedis.once('ready', onReady);
        generalRedis.once('error', onError);
      }),
      new Promise<void>((resolve, reject) => {
        const onReady = () => { bullRedis.removeListener('error', onError); resolve(); };
        const onError = (err: Error) => { bullRedis.removeListener('ready', onReady); reject(err); };
        bullRedis.once('ready', onReady);
        bullRedis.once('error', onError);
      }),
    ]);
    healthState.redis = 'connected';
    healthState.bullmqRedis = 'connected';
    logBoot('redis', 'Redis connected');
  } catch (error) {
    healthState.redis = 'error';
    healthState.bullmqRedis = 'error';
    logger.error(`[BOOT:redis] Connection failed: ${error instanceof Error ? error.message : error}`);
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  // ── Step 3: Create Express app ──
  logBoot('express', 'Creating Express app');
  const app = createApp();
  const httpServer = http.createServer(app);

  // Health endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: bootstrapPhase === 'ready' ? 'ok' : 'starting',
      phase: bootstrapPhase,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        ...healthState,
        redis: isRedisConnected() ? 'connected' : healthState.redis,
        bullmqRedis: isBullRedisConnected() ? 'connected' : healthState.bullmqRedis,
      },
    });
  });

  // Service info endpoint to avoid ambiguous root-path 404 in platform probes/manual checks.
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      service: 'vedaai-api',
      status: bootstrapPhase === 'ready' ? 'ok' : 'starting',
      endpoints: {
        health: '/health',
        api: '/api',
      },
    });
  });

  // ── Step 4: Initialize Socket.IO ──
  logBoot('socket', 'Initializing Socket.IO');
  initializeSocketServer(httpServer);

  // ── Step 5: Start HTTP server ──
  const port = env.PORT;
  httpServer.listen(port, () => {
    logger.info(`[BOOT:ready] Backend running on port ${port}`);
    logger.info('[BOOT:ready] Socket.IO ready');
    logger.info(`[BOOT:ready] Environment: ${env.NODE_ENV} | Mode: ${env.RENDER_WORKER_MODE}`);
    logBoot('ready', `Listening on port ${port}`);
  });

  // ── Step 6: Start workers based on mode ──
  if (env.RENDER_WORKER_MODE === 'worker' || env.RENDER_WORKER_MODE === 'both') {
    if (env.ENABLE_BACKGROUND_WORKERS) {
      startBackgroundWorkers().catch((error) => {
        logger.error(`[BOOT:workers] Failed: ${error instanceof Error ? error.message : error}`);
      });
    } else {
      logBoot('workers', 'Background workers disabled by ENABLE_BACKGROUND_WORKERS=false');
      healthState.workers = 'disabled';
    }
  } else {
    logBoot('workers', 'Worker mode=web — not starting background workers');
    healthState.workers = 'web-only';
  }

  // ── Step 7: Graceful shutdown ──
  const shutdown = async (signal: string) => {
    logger.info(`[SHUTDOWN] ${signal} received. Shutting down...`);
    isBootstrapping = false;
    if (queueTimeoutMonitor) { clearInterval(queueTimeoutMonitor); queueTimeoutMonitor = null; }
    if (stallMonitorInterval) { clearInterval(stallMonitorInterval); stallMonitorInterval = null; }

    const io = getSocketServer();
    io.close();

    if (generationQueueEvents) { await generationQueueEvents.close().catch(() => {}); generationQueueEvents = null; }
    if (pdfQueueEvents) { await pdfQueueEvents.close().catch(() => {}); pdfQueueEvents = null; }

    await disconnectDatabase();
    await Promise.allSettled([closeRedis(), closeBullRedis()]);

    httpServer.close(() => {
      logger.info('[SHUTDOWN] HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.warn('[SHUTDOWN] Timed out — forcing exit');
      process.exit(1);
    }, 15_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // Keep fallback/error handlers last so all routes (including /health) remain reachable.
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });
  app.use(errorMiddleware);
}

logBoot('start', 'Calling bootstrap()');
bootstrap().catch((error) => {
  logger.error(`[BOOT:FATAL] ${error instanceof Error ? error.message : error}`);
  if (error instanceof Error && error.stack) logger.error(error.stack);
  process.exit(1);
});

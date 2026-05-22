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
import { closeRedis, closeBullRedis, getBullRedisClient, getBullRedisDiagnostics } from './config/redis';
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
const healthState = { db: 'disconnected', redis: 'disconnected', bullmqRedis: 'disconnected' };
let queueTimeoutMonitor: NodeJS.Timeout | null = null;
let stallMonitorInterval: NodeJS.Timeout | null = null;
let generationQueueEvents: QueueEvents | null = null;
let pdfQueueEvents: QueueEvents | null = null;

const QUEUE_TIMEOUT_MS = 2 * 60 * 1000;
const QUEUE_SWEEP_INTERVAL_MS = 30 * 1000;
const IN_PROGRESS_STUCK_TIMEOUT_MS = 10 * 60 * 1000;

function logBoot(phase: string, message: string) {
  bootstrapPhase = phase;
  console.log(`[BOOT:${phase}] ${message}`);
}

process.on('uncaughtException', (error) => {
  console.error(`[FATAL:uncaughtException] ${error.message}`);
  console.error(error.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error(`[FATAL:unhandledRejection] ${reason}`);
  if (reason instanceof Error) console.error(reason.stack);
});

process.on('exit', (code) => {
  console.log(`[FATAL:exit] Process exiting with code ${code} (phase=${bootstrapPhase})`);
});

function tryListen(server: http.Server, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const onError = (err: NodeJS.ErrnoException) => {
      server.removeListener('error', onError);
      reject(err);
    };
    server.once('error', onError);
    server.listen(port, () => {
      server.removeListener('error', onError);
      resolve(port);
    });
  });
}

async function findAvailablePort(preferred: number, maxTries = 5): Promise<number> {
  for (let i = 0; i < maxTries; i++) {
    const candidate = preferred + i;
    const tester = http.createServer();
    try {
      await tryListen(tester, candidate);
      tester.close();
      return candidate;
    } catch {
      tester.close();
      console.log(`[BOOT:port] Port ${candidate} in use — trying ${candidate + 1}`);
    }
  }
  throw new Error(`No available port in range ${preferred}–${preferred + maxTries - 1}`);
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
    });

    logger.warn(`Generation job ${job._id.toString()} timed out in queue and was marked failed`);
  }
}

async function failStaleInProgressJobs(): Promise<void> {
  const cutoff = new Date(Date.now() - IN_PROGRESS_STUCK_TIMEOUT_MS);
  const staleJobs = await GenerationJob.find({
    status: { $in: ['processing', 'generating', 'parsing', 'saving'] },
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
    });

    logger.warn(`Generation job ${job._id.toString()} was stale in-progress and marked failed`);
  }
}

async function bootstrap() {
  if (isBootstrapping) {
    console.warn('[BOOT] Bootstrap already running — skipping');
    return;
  }
  isBootstrapping = true;
  logBoot('init', 'Starting backend bootstrap...');

  // ── Step 1: Create Express app and HTTP server FIRST ──
  logBoot('express', 'Creating Express app');
  const app = express();
  const httpServer = http.createServer(app);

  // Register health endpoint immediately — reflects dynamic bootstrap state
  app.get('/health', (_req, res) => {
    const appStatus = bootstrapPhase === 'ready' ? 'ok' : 'starting';
    res.json({
      status: appStatus,
      phase: bootstrapPhase,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: { ...healthState },
    });
  });

  logBoot('socket', 'Initializing Socket.IO');
  initializeSocketServer(httpServer);

  // ── Step 2: Register middleware and routes (non-blocking) ──
  logBoot('middleware', 'Registering middleware');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(compression());
  app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
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

  logBoot('routes', 'Registering API routes');
  app.use('/api', apiRouter);

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });
  app.use(errorMiddleware);

  // ── Step 3: Start HTTP server (before waiting for DB/Redis) ──
  logBoot('port', 'Finding available port');
  let port: number;
  try {
    port = await findAvailablePort(env.PORT);
  } catch (portError) {
    console.error(`[BOOT:port] ${portError instanceof Error ? portError.message : String(portError)}`);
    process.exit(1);
  }

  httpServer.listen(port, () => {
    console.log(`[BOOT:ready] Backend running on http://localhost:${port}`);
    console.log(`[BOOT:ready] Socket.IO ready`);
    console.log(`[BOOT:ready] Environment: ${env.NODE_ENV}`);
    logBoot('ready', `Listening on port ${port}`);
  });

  // ── Step 4: Initialize DB in background (non-blocking) ──
  logBoot('mongodb', 'Connecting to MongoDB...');
  (async () => {
    try {
      await connectDatabase();
      healthState.db = 'connected';
      console.log('[BOOT:mongodb] Connected successfully');
    } catch (error) {
      const isAuthError =
        error instanceof Error &&
        (error.message.includes('bad auth') || error.message.includes('8000'));
      if (isAuthError) {
        console.error('[BOOT:mongodb] AUTHENTICATION FAILED — check MONGODB_URI');
        return;
      }
      console.warn('[BOOT:mongodb] Connection failed — API routes may be unavailable');
    }
  })();

  // ── Step 5: Initialize BullMQ/Redis/Workers in background (non-blocking) ──
  logBoot('bullmq', 'Initializing BullMQ workers and queues...');
  (async () => {
    try {
      healthState.bullmqRedis = 'connecting';
      createAiGenerationWorker();
      createPdfWorker();
      healthState.bullmqRedis = 'connected';
      console.log('[BOOT:bullmq] Workers created (AI + PDF)');

      const bullConnection = getBullRedisClient();
      generationQueueEvents = new QueueEvents('generation', {
        connection: bullConnection,
        skipVersionCheck: true,
      });
      pdfQueueEvents = new QueueEvents('pdf', {
        connection: bullConnection,
        skipVersionCheck: true,
      });

      generationQueueEvents.on('completed', ({ jobId }) => console.log(`[QUEUE:generation] completed jobId=${jobId}`));
      generationQueueEvents.on('failed', ({ jobId, failedReason }) => console.warn(`[QUEUE:generation] failed jobId=${jobId} reason=${failedReason}`));
      generationQueueEvents.on('stalled', ({ jobId }) => console.error(`[QUEUE:generation] STALLED jobId=${jobId}`));

      pdfQueueEvents.on('completed', ({ jobId }) => console.log(`[QUEUE:pdf] completed jobId=${jobId}`));
      pdfQueueEvents.on('failed', ({ jobId, failedReason }) => console.warn(`[QUEUE:pdf] failed jobId=${jobId} reason=${failedReason}`));

      console.log('[BOOT:bullmq] Queue events initialized');
    } catch (error) {
      console.warn(`[BOOT:bullmq] Failed to initialize: ${error instanceof Error ? error.message : error}`);
    }

    // Start queue timeout watchdog
    queueTimeoutMonitor = setInterval(() => {
      void Promise.all([
        failStaleQueuedJobs(),
        failStaleInProgressJobs(),
      ]).catch((e) => console.error('[WATCHDOG] Sweep failed:', e));
    }, QUEUE_SWEEP_INTERVAL_MS);
    void Promise.all([
      failStaleQueuedJobs(),
      failStaleInProgressJobs(),
    ]).catch((e) => console.error('[WATCHDOG] Initial sweep failed:', e));

    // Start stall monitor
    stallMonitorInterval = setInterval(() => {
      const diag = getBullRedisDiagnostics();
      console.log(
        `[STALL] redis=${diag.status} connects=${diag.connectCount} reconnects=${diag.reconnectCount} errors=${diag.errorCount} stalled=${getStalledAiJobCount()} active=${getActiveAiJobCount()}`
      );
    }, 60_000);

    console.log('[BOOT:bullmq] Background initialization complete');
  })();

  // ── Step 6: Replace health endpoint with full version ──
  // (the routes array allows overriding the early health route)
  logBoot('health', 'Registering full health endpoint');

  // ── Step 7: Graceful shutdown ──
  const shutdown = async (signal: string) => {
    console.log(`[SHUTDOWN] ${signal} received. Shutting down...`);
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
      console.log('[SHUTDOWN] HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => {
      console.warn('[SHUTDOWN] Timed out — forcing exit');
      process.exit(1);
    }, 15_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

logBoot('start', 'Calling bootstrap()');
bootstrap().catch((error) => {
  console.error(`[BOOT:FATAL] ${error instanceof Error ? error.message : error}`);
  if (error instanceof Error) console.error(error.stack);
  process.exit(1);
});
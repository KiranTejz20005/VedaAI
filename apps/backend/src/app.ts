import 'express-async-errors';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase, isDatabaseConnected } from './config/db';
import { closeRedis, isRedisConnected } from './config/redis';
import { initializeSocketServer, getSocketServer } from './sockets/socket.server';
import { createAiGenerationWorker } from './workers/aiGeneration.worker';
import { createPdfWorker } from './workers/pdf.worker';
import { getGenerationQueue } from './queues/generation.queue';
import { getPdfQueue } from './queues/pdf.queue';
import { Assignment } from './models/Assignment.model';
import { GenerationJob } from './models/GenerationJob.model';
import { emitToAssignment } from './sockets/socket.server';
import apiRouter from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { logger } from './utils/logger';

let isBootstrapping = false;
let queueTimeoutMonitor: NodeJS.Timeout | null = null;

const QUEUE_TIMEOUT_MS = 2 * 60 * 1000;
const QUEUE_SWEEP_INTERVAL_MS = 30 * 1000;

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
      logger.warn(`Port ${candidate} is in use — trying ${candidate + 1}…`);
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

async function bootstrap() {
  if (isBootstrapping) {
    logger.warn('Bootstrap already running — skipping duplicate invocation');
    return;
  }
  isBootstrapping = true;

  try {
    await connectDatabase();
  } catch (error) {
    const isAuthError =
      error instanceof Error &&
      (error.message.includes('bad auth') || error.message.includes('8000'));
    if (isAuthError) {
      logger.error('MongoDB authentication failed. Check MONGODB_URI in .env');
      process.exit(1);
    }
    logger.warn('Starting without MongoDB. Some API routes may fail.');
  }

  const app = express();
  const httpServer = http.createServer(app);

  initializeSocketServer(httpServer);

  let aiWorker: ReturnType<typeof createAiGenerationWorker> | null = null;
  let pdfWorker: ReturnType<typeof createPdfWorker> | null = null;
  try {
    aiWorker = createAiGenerationWorker();
    pdfWorker = createPdfWorker();
    logger.info('Workers started: AI generation, PDF');
  } catch (error) {
    logger.warn('Starting without BullMQ workers. Redis may be unavailable.');
  }

  queueTimeoutMonitor = setInterval(() => {
    void failStaleQueuedJobs().catch((error) => {
      logger.error('Queue timeout watchdog failed:', error);
    });
  }, QUEUE_SWEEP_INTERVAL_MS);

  void failStaleQueuedJobs().catch((error) => {
    logger.error('Initial queue timeout sweep failed:', error);
  });

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

  app.get('/health', async (_req, res) => {
    const dbStatus = isDatabaseConnected() ? 'connected' : 'disconnected';
    const redisStatus = isRedisConnected() ? 'connected' : 'disconnected';

    let queueMetrics = { generation: {}, pdf: {} };
    try {
      const genQueue = getGenerationQueue();
      const pQueue = getPdfQueue();
      const [genWaiting, genActive, genFailed, pdfWaiting, pdfActive, pdfFailed] = await Promise.all([
        genQueue.getWaitingCount(),
        genQueue.getActiveCount(),
        genQueue.getFailedCount(),
        pQueue.getWaitingCount(),
        pQueue.getActiveCount(),
        pQueue.getFailedCount(),
      ]);
      queueMetrics = {
        generation: { waiting: genWaiting, active: genActive, failed: genFailed },
        pdf: { waiting: pdfWaiting, active: pdfActive, failed: pdfFailed },
      };
    } catch {
      // Queue metrics not available when Redis is down
    }

    res.status(isDatabaseConnected() ? 200 : 503).json({
      status: isDatabaseConnected() ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: dbStatus,
        redis: redisStatus,
        workers: { ai: aiWorker !== null, pdf: pdfWorker !== null },
        queues: redisStatus === 'connected' ? queueMetrics : undefined,
      },
    });
  });

  app.use('/api', apiRouter);

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });

  app.use(errorMiddleware);

  let port: number;
  try {
    port = await findAvailablePort(env.PORT);
  } catch (portError) {
    logger.error(portError instanceof Error ? portError.message : String(portError));
    process.exit(1);
  }

  if (port !== env.PORT) {
    logger.warn(`Preferred port ${env.PORT} busy — using port ${port}`);
  }

  httpServer.listen(port, () => {
    logger.info(`Backend running on http://localhost:${port}`);
    logger.info(`Socket.IO ready`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    isBootstrapping = false;
    if (queueTimeoutMonitor) {
      clearInterval(queueTimeoutMonitor);
      queueTimeoutMonitor = null;
    }
    const io = getSocketServer();
    io.close();
    await Promise.allSettled([aiWorker?.close(), pdfWorker?.close()]);
    await disconnectDatabase();
    await closeRedis();
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.warn('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
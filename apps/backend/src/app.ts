import 'express-async-errors';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { connectDatabase } from './config/db';
import { initializeSocketServer } from './sockets/socket.server';
import { createAiGenerationWorker } from './workers/aiGeneration.worker';
import { createPdfWorker } from './workers/pdf.worker';
import assignmentRoutes from './routes/assignment.routes';
import paperRoutes from './routes/paper.routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { logger } from './utils/logger';

async function bootstrap() {
  // Connect to database
  await connectDatabase();

  const app = express();
  const httpServer = http.createServer(app);

  // Initialize Socket.IO
  initializeSocketServer(httpServer);

  // Start BullMQ workers
  const aiWorker = createAiGenerationWorker();
  const pdfWorker = createPdfWorker();

  logger.info('Workers started: AI generation, PDF');

  // Security & parsing middleware
  app.use(helmet());
  app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
  });
  app.use('/api', limiter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.NODE_ENV });
  });

  // Routes
  app.use('/api/assignments', assignmentRoutes);
  app.use('/api/papers', paperRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });

  // Error middleware (must be last)
  app.use(errorMiddleware);

  // Start server
  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 VedaAI backend running on http://localhost:${env.PORT}`);
    logger.info(`🔌 Socket.IO ready`);
    logger.info(`📦 Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    await aiWorker.close();
    await pdfWorker.close();
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { isRedisConnected, isBullRedisConnected } from '../config/redis';
import { getActiveAiJobCount, getStalledAiJobCount } from '../workers/aiGeneration.worker';
import assignmentRoutes from './assignment.routes';
import paperRoutes from './paper.routes';

const apiRouter = Router();

// ── Health check endpoints ──

apiRouter.get('/health/redis', asyncHandler(async (_req, res) => {
  const redisOk = isRedisConnected();
  const bullRedisOk = isBullRedisConnected();
  const ok = redisOk && bullRedisOk;
  res.status(ok ? 200 : 503).json({
    success: ok,
    redis: { status: redisOk ? 'connected' : 'disconnected' },
    bullmq: { status: bullRedisOk ? 'connected' : 'disconnected' },
  });
}));

apiRouter.get('/health/queue', asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    activeJobs: getActiveAiJobCount(),
    stalledJobs: getStalledAiJobCount(),
  });
}));

apiRouter.get('/health/providers', asyncHandler(async (_req, res) => {
  const configuredProviders: string[] = [];
  if (process.env.ANTHROPIC_API_KEY) configuredProviders.push('anthropic');
  if (process.env.NVIDIA_API_KEY) configuredProviders.push('nvidia');
  if (process.env.GROQ_API_KEY) configuredProviders.push('groq');
  if (process.env.OPENAI_API_KEY) configuredProviders.push('openai');
  res.json({
    success: true,
    configuredProviders,
    providerCount: configuredProviders.length,
  });
}));

// ── Main routes ──

// Versioned API routes
apiRouter.use('/v1/assignments', assignmentRoutes);
apiRouter.use('/v1/papers', paperRoutes);

// Backward compatible legacy aliases
apiRouter.use('/assignments', assignmentRoutes);
apiRouter.use('/papers', paperRoutes);

export default apiRouter;

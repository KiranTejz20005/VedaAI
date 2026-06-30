import { Request, Response, Router } from 'express';
import { getRedisClient } from '../../config/redis';
import prisma from '../../config/prisma';
import { getActiveAiJobCount, getStalledAiJobCount } from '../../workers/aiGeneration.worker';

const router = Router();

router.get('/metrics', async (_req: Request, res: Response) => {
  const start = Date.now();
  try {
    const [dbOk, redisOk, activeJobs, stalledJobs] = await Promise.all([
      prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      getRedisClient().ping().then(() => true).catch(() => false),
      getActiveAiJobCount(),
      getStalledAiJobCount(),
    ]);

    const metrics = {
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      db: { connected: dbOk },
      redis: { connected: redisOk },
      queues: {
        generation: { active: activeJobs, stalled: stalledJobs },
      },
    };

    res.set('Content-Type', 'application/json');
    res.json({
      success: true,
      metrics,
      durationMs: Date.now() - start,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Metrics collection failed',
      durationMs: Date.now() - start,
    });
  }
});

export default router;

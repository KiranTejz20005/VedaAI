import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { isRedisConnected, isBullRedisConnected } from '../config/redis';
import { getActiveAiJobCount, getStalledAiJobCount } from '../workers/aiGeneration.worker';
import assignmentRoutes from './assignment.routes';
import paperRoutes from './paper.routes';
import questionRoutes from './question.routes';
import reviewRoutes from './review.routes';
import assessmentRoutes from './assessment.routes';
import analyticsRoutes from './analytics.routes';
import exportRoutes from './export.routes';
import authRoutes from './auth.routes';
import groupRoutes from './group.routes';
import generationRoutes from './generation.routes';
import syllabusRoutes from './syllabus.routes';
import graderRoutes from './grader.routes';
import questionBankRoutes from './question-bank.routes';
import lessonRoutes from './lessons.routes';
import worksheetRoutes from './worksheets.routes';
import tutorRoutes from './tutor.routes';
import notesRoutes from './notes.routes';

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
  const providerCount = [
    process.env.ANTHROPIC_API_KEY,
    process.env.NVIDIA_API_KEY,
    process.env.GROQ_API_KEY,
    process.env.OPENAI_API_KEY,
  ].filter((key) => key && key.trim().length > 5).length;
  res.json({
    success: providerCount > 0,
    providerCount,
  });
}));

// ── Main routes ──

// Versioned API routes
apiRouter.use('/v1/assignments', assignmentRoutes);
apiRouter.use('/v1/papers', paperRoutes);
apiRouter.use('/v1/questions', questionRoutes);
apiRouter.use('/v1/reviews', reviewRoutes);
apiRouter.use('/v1/assessments', assessmentRoutes);
apiRouter.use('/v1/analytics', analyticsRoutes);
apiRouter.use('/v1/exports', exportRoutes);

// Auth, groups, and generation
apiRouter.use('/v1/auth', authRoutes);
apiRouter.use('/v1/groups', groupRoutes);
apiRouter.use('/v1/generate', generationRoutes);
apiRouter.use('/v1/syllabus', syllabusRoutes);
apiRouter.use('/v1/grader', graderRoutes);
apiRouter.use('/v1/question-bank', questionBankRoutes);
apiRouter.use('/v1/lessons', lessonRoutes);
apiRouter.use('/v1/worksheets', worksheetRoutes);
apiRouter.use('/v1/tutor', tutorRoutes);
apiRouter.use('/v1/notes', notesRoutes);

// Backward compatible legacy aliases
apiRouter.use('/assignments', assignmentRoutes);
apiRouter.use('/papers', paperRoutes);
apiRouter.use('/questions', questionRoutes);

export default apiRouter;

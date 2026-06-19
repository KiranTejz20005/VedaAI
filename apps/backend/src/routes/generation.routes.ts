import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { generateQuestion, generateQuestions, saveQuizSession, getQuizHistory, clearQuizHistory } from '../controllers/generation.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../security/access-control';
import { PERMISSIONS } from '../security/permissions';
import { quizGenerationRateLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

router.use(authenticate);
router.use(requirePermission(PERMISSIONS.GENERATE_PAPER));

router.post('/question', quizGenerationRateLimiter, asyncHandler(generateQuestion));
router.post('/questions', quizGenerationRateLimiter, asyncHandler(generateQuestions));
router.post('/session', asyncHandler(saveQuizSession));
router.get('/history', asyncHandler(getQuizHistory));
router.delete('/history', asyncHandler(clearQuizHistory));

export default router;

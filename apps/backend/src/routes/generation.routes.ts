import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { generateQuestion, generateQuestions, saveQuizSession, getQuizHistory, clearQuizHistory } from '../controllers/generation.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/question', asyncHandler(generateQuestion));
router.post('/questions', asyncHandler(generateQuestions));
router.post('/session', asyncHandler(saveQuizSession));
router.get('/history', asyncHandler(getQuizHistory));
router.delete('/history', asyncHandler(clearQuizHistory));

export default router;

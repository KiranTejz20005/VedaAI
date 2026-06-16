import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { generateQuestion } from '../controllers/generation.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/question', asyncHandler(generateQuestion));

export default router;

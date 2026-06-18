import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middlewares/auth.middleware';
import { chatWithTutor } from '../controllers/tutor.controller';

const router = Router();

router.use(authenticate);

router.post('/chat', asyncHandler(chatWithTutor));

export default router;

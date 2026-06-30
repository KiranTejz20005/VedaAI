import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middlewares/auth.middleware';
import {
  createSession,
  listSessions,
  getSession,
  chat,
  closeSession,
} from '../controllers/tutor.controller';

const router = Router();

router.use(authenticate);

// Session management
router.post('/sessions', asyncHandler(createSession));
router.get('/sessions', asyncHandler(listSessions));
router.get('/sessions/:sessionId', asyncHandler(getSession));
router.post('/sessions/:sessionId/chat', asyncHandler(chat));
router.patch('/sessions/:sessionId/close', asyncHandler(closeSession));

export default router;

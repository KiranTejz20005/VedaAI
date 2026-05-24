import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/async-handler';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import {
  createAssignmentHandler,
  generateAssignmentHandler,
  listAssignmentsHandler,
  getAssignmentHandler,
  deleteAssignmentHandler,
} from '../controllers/assignment.controller';

const router = Router();

const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Generation rate limit exceeded. Please try again later.' },
});

// GET /api/assignments
router.get('/', asyncHandler(listAssignmentsHandler));

// POST /api/assignments  (with optional file uploads)
router.post('/', uploadMiddleware.array('files', 10), asyncHandler(createAssignmentHandler));

// GET /api/assignments/:id
router.get('/:id', asyncHandler(getAssignmentHandler));

// DELETE /api/assignments/:id
router.delete('/:id', asyncHandler(deleteAssignmentHandler));

// POST /api/assignments/:id/generate
router.post('/:id/generate', generateLimiter, asyncHandler(generateAssignmentHandler));

export default router;

import { Router } from 'express';
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

// GET /api/assignments
router.get('/', asyncHandler(listAssignmentsHandler));

// POST /api/assignments  (with optional file uploads)
router.post('/', uploadMiddleware.array('files', 5), asyncHandler(createAssignmentHandler));

// GET /api/assignments/:id
router.get('/:id', asyncHandler(getAssignmentHandler));

// DELETE /api/assignments/:id
router.delete('/:id', asyncHandler(deleteAssignmentHandler));

// POST /api/assignments/:id/generate
router.post('/:id/generate', asyncHandler(generateAssignmentHandler));

export default router;

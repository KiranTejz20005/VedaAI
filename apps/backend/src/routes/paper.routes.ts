import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { getPaperHandler, downloadPdfHandler } from '../controllers/paper.controller';

const router = Router();

// GET /api/papers/:assignmentId
router.get('/:assignmentId', asyncHandler(getPaperHandler));

// GET /api/papers/download/:filename
router.get('/download/:filename', asyncHandler(downloadPdfHandler));

export default router;

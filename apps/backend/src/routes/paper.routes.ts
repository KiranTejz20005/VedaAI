import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { getPaperHandler, downloadPdfHandler } from '../controllers/paper.controller';
import { GenerationJob } from '../models/GenerationJob.model';

const router = Router();

// GET /api/papers/job/:assignmentId - job status for polling (must be before /:assignmentId)
router.get('/job/:assignmentId', asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const job = await GenerationJob.findOne({ assignmentId }).sort({ createdAt: -1 }).lean();
  if (!job) {
    res.status(404).json({ success: false, error: 'No generation job found' });
    return;
  }
  res.json({
    success: true,
    data: { status: job.status, progress: job.progress, error: job.error },
  });
}));

// GET /api/papers/download/:filename - must be before /:assignmentId
router.get('/download/:filename', asyncHandler(downloadPdfHandler));

// GET /api/papers/:assignmentId
router.get('/:assignmentId', asyncHandler(getPaperHandler));

export default router;
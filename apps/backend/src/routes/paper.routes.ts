import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { getPaperHandler, downloadPdfHandler } from '../controllers/paper.controller';
import { GenerationJob } from '../models/GenerationJob.model';
import { Assignment } from '../models/Assignment.model';
import { getPaper } from '../services/paper.service';
import { buildCanonicalGenerationState } from '../services/canonical-metadata.service';

const router = Router();

// GET /api/papers/job/:assignmentId - job status for polling (must be before /:assignmentId)
router.get('/job/:assignmentId', asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const [assignment, job, paper] = await Promise.all([
    Assignment.findById(assignmentId),
    GenerationJob.findOne({ assignmentId }).sort({ generationSeq: -1, createdAt: -1 }),
    getPaper(assignmentId),
  ]);

  if (!assignment) {
    res.status(404).json({ success: false, error: 'Assignment not found' });
    return;
  }

  const state = buildCanonicalGenerationState({
    assignment: assignment as any,
    job: (job as any) ?? null,
    paper: (paper as any) ?? null,
  });

  res.json({
    success: true,
    data: {
      status: job?.status ?? 'queued',
      error: job?.error ?? null,
      jobRecordId: job?._id?.toString() ?? null,
      generationSeq: (job as any)?.generationSeq ?? (assignment as any)?.generationSeq ?? 0,
      version: (job as any)?.progressVersion ?? 0,
      paperId: paper?._id?.toString() ?? null,
      ts: (job as any)?.updatedAt ? new Date((job as any).updatedAt).getTime() : Date.now(),
      ...state,
    },
  });
}));

// GET /api/papers/download/:filename - must be before /:assignmentId
router.get('/download/:filename', asyncHandler(downloadPdfHandler));

// GET /api/papers/:assignmentId
router.get('/:assignmentId', asyncHandler(getPaperHandler));

export default router;

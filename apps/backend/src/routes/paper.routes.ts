import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { getPaperHandler, downloadPdfHandler } from '../controllers/paper.controller';
import prisma from '../config/prisma';
import { getPaper } from '../services/paper.service';
import { buildCanonicalGenerationState } from '../services/canonical-metadata.service';

const router = Router();

// GET /api/papers/job/:assignmentId - job status for polling (must be before /:assignmentId)
router.get('/job/:assignmentId', asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const [assignment, job, paper] = await Promise.all([
    prisma.assignment.findUnique({ where: { id: assignmentId } }),
    prisma.generationJob.findFirst({
      where: { assignmentId },
      orderBy: [{ generationSeq: 'desc' }, { createdAt: 'desc' }],
    }),
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
      jobRecordId: job?.id ?? null,
      generationSeq: job?.generationSeq ?? (assignment as any).generationSeq ?? 0,
      version: job?.progressVersion ?? 0,
      paperId: (paper as any)?.id ?? null,
      ts: job?.updatedAt ? new Date(job.updatedAt).getTime() : Date.now(),
      ...state,
    },
  });
}));

// GET /api/papers/download/:filename - must be before /:assignmentId
router.get('/download/:filename', asyncHandler(downloadPdfHandler));

// GET /api/papers/:assignmentId
router.get('/:assignmentId', asyncHandler(getPaperHandler));

export default router;

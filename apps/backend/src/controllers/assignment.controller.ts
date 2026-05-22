import type { Request, Response } from 'express';
import { createAssignmentSchema } from '../validators/assignment.validator';
import {
  createAssignment,
  enqueueGeneration,
  listAssignments,
  getAssignment,
  deleteAssignment,
} from '../services/assignment.service';
import { sendSuccess, sendError } from '../utils/api-response';
import { emitToAssignment } from '../sockets/socket.server';
import type { FileRef } from '../types/assignment.types';
import { GenerationJob } from '../models/GenerationJob.model';
import { logger } from '../utils/logger';
import { getPaper } from '../services/paper.service';
import { buildCanonicalGenerationState } from '../services/canonical-metadata.service';

export async function createAssignmentHandler(req: Request, res: Response): Promise<void> {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  const rawQuestionConfig = typeof body.questionConfig === 'string'
    ? body.questionConfig
    : JSON.stringify(body.questionConfig);

  let questionConfig: Record<string, any> = {};
  if (rawQuestionConfig) {
    try {
      questionConfig = typeof rawQuestionConfig === 'string' ? JSON.parse(rawQuestionConfig) : rawQuestionConfig;
    } catch {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: { questionConfig: ['Invalid questionConfig JSON'] },
      });
      return;
    }
  }

  const parsed = createAssignmentSchema.safeParse({
    ...body,
    duration: Number(body.duration),
    totalMarks: Number(body.totalMarks),
    questionConfig: {
      types: questionConfig.types ?? [],
      count: Number(questionConfig.count) || 0,
      difficulty: {
        easy: questionConfig.difficulty?.easy !== undefined ? Number(questionConfig.difficulty.easy) : 34,
        medium: questionConfig.difficulty?.medium !== undefined ? Number(questionConfig.difficulty.medium) : 33,
        hard: questionConfig.difficulty?.hard !== undefined ? Number(questionConfig.difficulty.hard) : 33,
      },
    },
  });

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const files: FileRef[] = (req.files as Express.Multer.File[] ?? []).map((f) => ({
    originalName: f.originalname,
    storedName: f.filename,
    mimeType: f.mimetype,
    size: f.size,
    path: f.path,
  }));

  const assignment = await createAssignment(parsed.data, files);
  const { jobId, position, jobRecordId, generationSeq } = await enqueueGeneration(assignment._id.toString());
  assignment.status = 'queued';

  emitToAssignment(assignment._id.toString(), 'generation:queued', {
    assignmentId: assignment._id.toString(),
    jobId,
    jobRecordId,
    generationSeq,
    position,
    version: 0,
    ts: Date.now(),
  });

  sendSuccess(res, { assignment, jobId, position, jobRecordId, generationSeq }, 201, 'Assignment created and queued successfully');
}

export async function generateAssignmentHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  logger.debug(`[generateHandler] START | assignmentId=${id}`);

  const assignment = await getAssignment(id);
  if (!assignment) {
    logger.warn(`[generateHandler] Assignment ${id} not found`);
    sendError(res, 'Assignment not found', 404);
    return;
  }
  logger.debug(`[generateHandler] Assignment found: status=${assignment.status} title="${assignment.title}"`);

  if (['queued', 'generating'].includes(assignment.status)) {
    logger.warn(`[generateHandler] Generation already in progress (status=${assignment.status}) — returning 409`);
    sendError(res, 'Generation already in progress', 409);
    return;
  }
  if (assignment.status === 'partially_generated') {
    logger.debug(`[generateHandler] Assignment has partial generation — allowing regeneration`);
  }

  // Only the Assignment's activeGenerationJobId counts as "in progress". This avoids stale
  // GenerationJob rows from older runs blocking regeneration.
  const activeId = (assignment as any).activeGenerationJobId ? String((assignment as any).activeGenerationJobId) : '';
  if (activeId) {
    const activeJob = await GenerationJob.findById(activeId).lean();
    if (activeJob && ['queued', 'extracting_content', 'topic_preprocessing', 'generation_planning', 'batch_generating', 'validating', 'answer_key_generating', 'pdf_composing', 'persisting', 'pdf-generating'].includes(activeJob.status)) {
      logger.warn(`[generateHandler] Active GenerationJob in progress (${activeJob._id}, status=${activeJob.status}) — returning 409`);
      sendError(res, 'Generation already in progress', 409);
      return;
    }
  }

  logger.debug(`[generateHandler] Enqueuing generation...`);
  const t0 = Date.now();
  const { jobId, position, jobRecordId, generationSeq } = await enqueueGeneration(id);
  logger.debug(`[generateHandler] Enqueued in ${Date.now() - t0}ms | jobId=${jobId} position=${position}`);

  logger.debug(`[generateHandler] Emitting generation:queued via WebSocket`);
  emitToAssignment(id, 'generation:queued', {
    assignmentId: id,
    jobId,
    jobRecordId,
    generationSeq,
    position,
    version: 0,
    ts: Date.now(),
  });

  logger.info(`[generateHandler] COMPLETE — returning 202`);
  sendSuccess(res, { jobId, position, jobRecordId, generationSeq }, 202, 'Generation queued successfully');
}

export async function listAssignmentsHandler(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const status = req.query.status as string | undefined;

  const result = await listAssignments(page, limit, status);

  res.status(200).json({
    success: true,
    data: result.assignments,
    pagination: {
      page: result.page,
      limit,
      total: result.total,
      pages: Math.ceil(result.total / limit),
    },
  });
}

export async function getAssignmentHandler(req: Request, res: Response): Promise<void> {
  const assignment = await getAssignment(req.params.id);
  if (!assignment) {
    sendError(res, 'Assignment not found', 404);
    return;
  }
  const [job, paper] = await Promise.all([
    GenerationJob.findOne({ assignmentId: req.params.id }).sort({ generationSeq: -1, createdAt: -1 }),
    getPaper(req.params.id),
  ]);
  const generationState = buildCanonicalGenerationState({
    assignment: assignment as any,
    job: (job as any) ?? null,
    paper: (paper as any) ?? null,
  });
  sendSuccess(res, { assignment, generationState });
}

export async function deleteAssignmentHandler(req: Request, res: Response): Promise<void> {
  const assignment = await getAssignment(req.params.id);
  if (!assignment) {
    sendError(res, 'Assignment not found', 404);
    return;
  }

  if (['queued', 'generating', 'partially_generated'].includes(assignment.status)) {
    const activeId = (assignment as any).activeGenerationJobId ? String((assignment as any).activeGenerationJobId) : '';
    const activeJob = activeId ? await GenerationJob.findById(activeId).lean() : null;

    if (activeJob && ['queued', 'extracting_content', 'topic_preprocessing', 'generation_planning', 'batch_generating', 'validating', 'answer_key_generating', 'pdf_composing', 'persisting', 'pdf-generating'].includes(activeJob.status)) {
      sendError(res, 'Cannot delete assignment while generation is in progress', 409);
      return;
    }

    logger.warn(`Assignment ${req.params.id} had stale status=${assignment.status} with no active job; allowing delete`);
  }

  await deleteAssignment(req.params.id);
  logger.info(`Assignment deleted: ${req.params.id}`);
  sendSuccess(res, null, 200, 'Assignment deleted successfully');
}

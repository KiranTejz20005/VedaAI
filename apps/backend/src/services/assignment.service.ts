import { Assignment, type IAssignment } from '../models/Assignment.model';
import { GenerationJob } from '../models/GenerationJob.model';
import { getGenerationQueue } from '../queues/generation.queue';
import type { CreateAssignmentInput } from '../validators/assignment.validator';
import type { FileRef } from '../types/assignment.types';
import { logger } from '../utils/logger';

export interface AssignmentListResult {
  assignments: IAssignment[];
  total: number;
  page: number;
  limit: number;
}

export async function createAssignment(
  input: CreateAssignmentInput,
  files: FileRef[]
): Promise<IAssignment> {
  const { typeBreakdown, ...rest } = input;
  const assignment = await Assignment.create({
    ...rest,
    ...(typeBreakdown ? { typeBreakdown } : {}),
    dueDate: new Date(input.dueDate),
    uploadedFiles: files,
    status: 'draft',
  });

  logger.info(`Assignment created: ${assignment._id.toString()}`);
  return assignment;
}

export async function enqueueGeneration(assignmentId: string): Promise<{ jobId: string; position: number; jobRecordId: string; generationSeq: number }> {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

  // If a run has already finalized successfully, do not allow a stale enqueue path
  // to mutate it implicitly. The controller layer decides when regeneration is allowed.
  const nextSeq = (assignment.generationSeq ?? 0) + 1;
  await Assignment.findByIdAndUpdate(assignmentId, {
    generationSeq: nextSeq,
    status: 'queued',
    finalizedAt: null,
  });

  // Create job record in DB
  const jobRecord = await GenerationJob.create({
    assignmentId: assignment._id,
    generationSeq: nextSeq,
    progressVersion: 0,
    stageIndex: 0,
    status: 'queued',
    progress: 0,
    startedAt: new Date(),
  });

  // Mark this job as the ONLY job allowed to mutate assignment generation state.
  await Assignment.findByIdAndUpdate(assignmentId, { activeGenerationJobId: jobRecord._id });

  // Add to BullMQ with unique jobId to avoid BullMQ's silent dedup rejection
  const queue = getGenerationQueue();
  const job = await queue.add(
    'generate-paper',
    { assignmentId, jobRecordId: jobRecord._id.toString() },
    { jobId: `gen-${assignmentId}-seq-${nextSeq}` }
  );

  // Update job record with bullmq job id
  await GenerationJob.findByIdAndUpdate(jobRecord._id, { bullmqJobId: job.id ?? '' });

  const waiting = await queue.getWaitingCount();
  logger.info(`Enqueued generation job ${job.id} for assignment ${assignmentId}`);

  return { jobId: job.id ?? '', position: waiting, jobRecordId: jobRecord._id.toString(), generationSeq: nextSeq };
}

export async function listAssignments(
  page = 1,
  limit = 10,
  status?: string
): Promise<AssignmentListResult> {
  const filter = status ? { status } : {};
  const skip = (page - 1) * limit;

  const [assignments, total] = await Promise.all([
    Assignment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Assignment.countDocuments(filter),
  ]);

  return { assignments: assignments as unknown as IAssignment[], total, page, limit };
}

export async function getAssignment(id: string): Promise<IAssignment | null> {
  return Assignment.findById(id);
}

export async function deleteAssignment(id: string): Promise<void> {
  await Assignment.findByIdAndDelete(id);
}

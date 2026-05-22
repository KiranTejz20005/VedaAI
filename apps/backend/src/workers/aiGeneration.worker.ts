import { Worker } from 'bullmq';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import { env } from '../config/env';
import { getBullRedisClient } from '../config/redis';
import { Assignment } from '../models/Assignment.model';
import { GenerationJob } from '../models/GenerationJob.model';
import { GeneratedPaper } from '../models/GeneratedPaper.model';
import { generatePaper, generateAnswersForPaper } from '../services/ai.service';
import { savePaper } from '../services/paper.service';
import { getPdfQueue } from '../queues/pdf.queue';
import { emitToAssignment } from '../sockets/socket.server';
import { classifyError } from '../services/quality-gate';
import type { GenerationJobData } from '../types/queue.types';
import type { GenerationMeta } from '../types/generation.types';
import type { GenerationStage } from '../types/socket.types';
import { buildCanonicalPaperMetadata } from '../services/canonical-metadata.service';
import { logger } from '../utils/logger';
import { withTimeout } from '../utils/timeout';

const GENERATION_TIMEOUT_MS = 120_000;

function sanitizeText(text: string): string {
  const before = text.length;
  const result = text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/[^\x20-\x7E\x0A\x0D\x80-\xFF\n\t]/g, '')
    .replace(/\b(?:data:image\/[a-z]+;base64[^\s]+)\b/gi, '[BINARY REMOVED]')
    .replace(/\b(?:https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg))\b/gi, '[URL REMOVED]')
    .replace(/\S*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\b/gi, '[IMAGE REMOVED]')
    .replace(/[\w\-./\\()]+\/(?:[\w\-./() ]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?))/gi, '[PATH REMOVED]')
    .replace(/\bimage\s*\.\s*(png|jpg|jpeg|gif|webp)\b/gi, '[REF REMOVED]')
    .replace(/\(\s*(?:png|jpg|jpeg|gif|webp|svg|bmp|ico)\s*\)/gi, '[FORMAT REMOVED]')
    .slice(0, 8000);
  const after = result.length;
  if (before !== after) logger.debug(`sanitizeText: ${before}→${after} chars (${before - after} removed)`);
  return result;
}

async function extractUploadedContent(files: Array<{ path: string; mimeType: string }>): Promise<{ content: string; wasSanitized: boolean }> {
  logger.debug(`[TRACE] extractUploadedContent: ${files.length} files`);
  const texts: string[] = [];
  let wasSanitized = false;
  for (const file of files) {
    try {
      const t0 = Date.now();
      if (file.mimeType === 'application/pdf') {
        logger.debug(`[TRACE] Reading PDF: ${file.path}`);
        const buffer = await fs.readFile(file.path);
        logger.debug(`[TRACE] PDF buffer: ${buffer.length} bytes, parsing...`);
        const parsed = await pdfParse(buffer);
        logger.debug(`[TRACE] PDF parsed: ${parsed.text?.length ?? 0} chars in ${Date.now() - t0}ms`);
        if (parsed.text && parsed.text.trim().length > 0) {
          const raw = parsed.text;
          const clean = sanitizeText(raw);
          if (clean !== raw) wasSanitized = true;
          texts.push(clean);
        } else {
          logger.warn(`[TRACE] PDF extracted no text: ${file.path}`);
        }
      } else if (file.mimeType === 'text/plain') {
        logger.debug(`[TRACE] Reading TXT: ${file.path}`);
        const raw = await fs.readFile(file.path, 'utf-8');
        logger.debug(`[TRACE] TXT read: ${raw.length} chars in ${Date.now() - t0}ms`);
        if (raw && raw.trim().length > 0) {
          const clean = sanitizeText(raw);
          if (clean !== raw) wasSanitized = true;
          texts.push(clean);
        }
      }
    } catch (e) {
      logger.warn(`[TRACE] Failed to read uploaded file: ${file.path}`, e);
    }
  }
  const combined = texts.join('\n\n').trim();
  logger.debug(`[TRACE] extractUploadedContent result: ${combined.length} chars, wasSanitized=${wasSanitized}`);
  return { content: combined || '', wasSanitized };
}

let aiWorker: Worker<GenerationJobData> | null = null;
let activeJobCount = 0;
let stalledJobCount = 0;
const stalledCounts = new Map<string, number>();

export function getActiveAiJobCount(): number {
  return activeJobCount;
}

export function getStalledAiJobCount(): number {
  return stalledJobCount;
}

export function createAiGenerationWorker() {
  if (aiWorker) return aiWorker;

  aiWorker = new Worker<GenerationJobData>(
    'generation',
    async (job) => {
      activeJobCount++;
      const { assignmentId, jobRecordId } = job.data;
      const jobStartTime = Date.now();
      logger.info(`[WORKER:START] Job ${job.id} | assignment=${assignmentId} | attempt=${job.attemptsMade + 1} | activeJobs=${activeJobCount}`);

      let assignment: any = null;
      let generationSeq = 0;
      try {
        // ── STEP 0: Validate job record ──
        logger.debug(`[STEP 0] Fetching GenerationJob: ${jobRecordId}`);
        const t0 = Date.now();
        const jobRecord = await GenerationJob.findById(jobRecordId).lean();
        generationSeq = Number((jobRecord as any)?.generationSeq ?? 0);
        logger.debug(`[STEP 0] GenerationJob fetched in ${Date.now() - t0}ms | status=${jobRecord?.status}`);
        if (!jobRecord || jobRecord.status === 'failed') {
          logger.error(`[STEP 0] Job record not found or already failed`);
          throw new Error('Generation job timed out in queue');
        }

        // Hard guard: only the Assignment's activeGenerationJobId is allowed to mutate state.
        // This prevents stale retries / duplicate jobs from overwriting a newer successful run.
        const ownerCheck = await Assignment.findById(assignmentId).select({ activeGenerationJobId: 1, generationSeq: 1, status: 1 }).lean();
        const activeJobId = ownerCheck?.activeGenerationJobId ? String(ownerCheck.activeGenerationJobId) : '';
        const activeSeq = Number((ownerCheck as any)?.generationSeq ?? 0);
        const jobSeq = generationSeq;
        if (!ownerCheck || activeJobId !== String(jobRecordId) || activeSeq !== jobSeq) {
          logger.warn(
            `[STALE JOB] Ignoring jobRecord=${jobRecordId} (seq=${jobSeq}) for assignment=${assignmentId}. ` +
            `Active jobRecord=${activeJobId || 'none'} (seq=${activeSeq}), status=${ownerCheck?.status}`
          );
          // Do not throw: throwing can trigger BullMQ retries and additional stale writes.
          return;
        }

        const emit = async (stage: GenerationStage, progress: number, message?: string) => {
          const e0 = Date.now();
          emitToAssignment(assignmentId, 'generation:progress', {
            assignmentId,
            progress,
            stage,
            message,
            jobRecordId,
            generationSeq,
            ts: Date.now(),
          });
          try {
            await GenerationJob.findByIdAndUpdate(jobRecordId, { status: stage, progress }).exec();
            logger.debug(`[EMIT] ${stage} ${progress}% "${message}" in ${Date.now() - e0}ms`);
          } catch (emitErr) {
            logger.warn(`[EMIT] DB update failed for ${stage}: ${emitErr}`);
          }
        };

        // ── STEP 1: Emit initial progress ──
        logger.debug(`[STEP 1] Emitting initial progress (queued, 0%)`);
        emitToAssignment(assignmentId, 'generation:progress', {
          assignmentId, progress: 0, stage: 'queued', message: 'Job started...',
          jobRecordId,
          generationSeq,
          ts: Date.now(),
        });

        logger.debug(`[STEP 2] Emitting processing (5%)`);
        await emit('extracting_content', 5, 'Queue initialized...');

        // ── STEP 3: Fetch assignment ──
        logger.debug(`[STEP 3] Fetching Assignment: ${assignmentId}`);
        const t3 = Date.now();
        assignment = await Assignment.findById(assignmentId).lean();
        logger.debug(`[STEP 3] Assignment fetched in ${Date.now() - t3}ms | title="${assignment?.title}" status=${assignment?.status}`);
        if (!assignment) {
          logger.error(`[STEP 3] Assignment ${assignmentId} not found`);
          throw new Error(`Assignment ${assignmentId} not found`);
        }
        logger.debug(`[STEP 3] Assignment has ${assignment.uploadedFiles?.length ?? 0} uploaded files, totalMarks=${assignment.totalMarks}`);

        // ── STEP 4: Update status to generating ──
        logger.debug(`[STEP 4] Setting assignment status to 'generating'`);
        const t4 = Date.now();
        await Assignment.findOneAndUpdate(
          { _id: assignmentId, activeGenerationJobId: jobRecordId },
          { status: 'generating' }
        );
        await job.updateProgress(5);
        logger.debug(`[STEP 4] Status updated in ${Date.now() - t4}ms`);

        // ── STEP 5: Extract uploaded content ──
        logger.debug(`[STEP 5] Extracting uploaded content from ${assignment.uploadedFiles?.length ?? 0} files`);
        const t5 = Date.now();
        const { content: uploadedContent, wasSanitized } = await extractUploadedContent(
          (assignment.uploadedFiles ?? []).map((f: { path: string; mimeType: string }) => ({ path: f.path, mimeType: f.mimeType }))
        );
        await job.updateProgress(15);
        logger.debug(`[STEP 5] Content extracted in ${Date.now() - t5}ms | ${uploadedContent.length} chars`);

        const sanitizeMsg = wasSanitized ? ' (image references removed from upload)' : '';
        await emit('topic_preprocessing', 15, `Syllabus extraction complete${sanitizeMsg}`);

        // ── STEP 6: Parse typeBreakdown ──
        let typeBreakdown: any[] | undefined;
        if ((assignment as any).typeBreakdown) {
          try {
            typeBreakdown = JSON.parse((assignment as any).typeBreakdown);
            logger.debug(`[STEP 6] typeBreakdown parsed: ${typeBreakdown?.length} items`);
          } catch (parseErr) {
            logger.warn(`[STEP 6] typeBreakdown JSON parse failed: ${parseErr}`);
          }
        } else {
          logger.debug(`[STEP 6] No typeBreakdown`);
        }

        await emit('generation_planning', 30, 'Building generation plan...');

        // ── STEP 7: AI generation (THE CRITICAL STEP) ──
        logger.info(`[STEP 7] Calling generatePaper() at ${Date.now() - jobStartTime}ms elapsed`);
        const t7 = Date.now();
        let paper: any;
        try {
          paper = await withTimeout(
            generatePaper(assignment as any, uploadedContent || undefined, typeBreakdown, job, async (stage, progress, stageMessage) => {
              await emit(stage, progress, stageMessage);
            }),
            GENERATION_TIMEOUT_MS,
            'Generation'
          );
          await job.updateProgress(80);
          logger.info(`[STEP 7] generatePaper() completed in ${Date.now() - t7}ms | title="${paper?.title}" sections=${paper?.sections?.length}`);
        } catch (genErr) {
          logger.error(`[STEP 7 FAILED] generatePaper() threw after ${Date.now() - t7}ms: ${genErr instanceof Error ? genErr.message : String(genErr)}`);
          if (genErr instanceof Error && genErr.stack) {
            logger.error(`[STEP 7 STACK] ${genErr.stack.split('\n').slice(0, 6).join('\n')}`);
          }
          throw genErr;
        }

        // ── STEP 7b: Generate answers separately (split pipeline) ──
        logger.info(`[STEP 7b] Generating answers for ${paper.sections.reduce((s: number, sec: any) => s + sec.questions.length, 0)} questions`);
        const t7b = Date.now();
        try {
          await emit('answer_key_generating', 87, 'Generating answer key...');
          paper = await generateAnswersForPaper(paper);
          await job.updateProgress(90);
          logger.info(`[STEP 7b] Answers generated in ${Date.now() - t7b}ms`);
        } catch (answerErr) {
          logger.error(`[STEP 7b] Answer generation failed: ${answerErr instanceof Error ? answerErr.message : String(answerErr)}`);
          throw answerErr;
        }

        // ── STEP 8: Emit validating ──
        logger.debug(`[STEP 8] AI output received, emitting validating`);
        await emit('validating', 80, 'Validating generated paper...');

        // ── STEP 9: Save paper ──
        logger.debug(`[STEP 9] Saving GeneratedPaper...`);
        const t9 = Date.now();
        let savedPaper: any;
        try {
          // Re-check ownership right before destructive paper write.
          const owner = await Assignment.findById(assignmentId).select({ activeGenerationJobId: 1, generationSeq: 1 }).lean();
          if (!owner || String(owner.activeGenerationJobId ?? '') !== String(jobRecordId)) {
            logger.warn(`[STALE JOB] Skipping savePaper for non-owner jobRecord=${jobRecordId} assignment=${assignmentId}`);
            return;
          }
          const provisionalMetadata = buildCanonicalPaperMetadata(assignment as any, paper as any);
          savedPaper = await savePaper(assignmentId, paper, assignment.duration, provisionalMetadata);
          await job.updateProgress(95);
          logger.info(`[STEP 9] GeneratedPaper saved in ${Date.now() - t9}ms | id=${savedPaper._id}`);
        } catch (saveErr) {
          logger.error(`[STEP 9 FAILED] savePaper() threw after ${Date.now() - t9}ms: ${saveErr instanceof Error ? saveErr.message : String(saveErr)}`);
          throw saveErr;
        }

        // ── STEP 10: Emit saving ──
        logger.debug(`[STEP 10] Emitting saving (85%)`);
        await emit('persisting', 97, 'Persisting metadata...');

        // ── STEP 11: Check for partial vs complete generation ──
        const requestedQty = assignment.questionConfig.count;
        const generatedQty = paper.sections.reduce((s: number, sec: any) => s + sec.questions.length, 0);
        const generatedMarks = paper.sections.reduce((s: number, sec: any) =>
          s + sec.questions.reduce((ms: number, q: any) => ms + (q.marks || 0), 0), 0);
        const isPartial = generatedQty < requestedQty;
        const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 2) - 1;

        logger.debug(`[STEP 11] Generated ${generatedQty}/${requestedQty} questions (${generatedMarks}/${assignment.totalMarks} marks)`);
        const t11 = Date.now();

        if (isPartial && !isFinalAttempt) {
          throw new Error(`Incomplete generation (${generatedQty}/${requestedQty}); retrying before finalize`);
        }

        if (isPartial) {
          const genMeta: GenerationMeta = {
            status: 'partially_generated',
            generatedQuestionCount: generatedQty,
            requestedQuestionCount: requestedQty,
            generatedMarks,
            requestedMarks: assignment.totalMarks,
            completedBatches: 1,
            failedBatches: 0,
            providerName: null,
            failureCategory: 'under_generation',
            failureReason: `Generated ${generatedQty}/${requestedQty} questions. The AI provider returned fewer questions than requested.`,
            diagnostics: null,
            partialPaper: null,
            completedAt: new Date(),
          };
          await Assignment.findOneAndUpdate(
            { _id: assignmentId, activeGenerationJobId: jobRecordId, status: { $ne: 'completed' } },
            { status: 'partially_generated', generationMeta: genMeta }
          );
          logger.info(`[STEP 11] Assignment marked as partially_generated (${generatedQty}/${requestedQty})`);
        } else {
          await Assignment.findOneAndUpdate(
            { _id: assignmentId, activeGenerationJobId: jobRecordId },
            { status: 'completed', finalizedAt: new Date() }
          );
          logger.debug(`[STEP 11] Assignment status updated to 'completed' in ${Date.now() - t11}ms`);
        }
        await job.updateProgress(99);

        // ── STEP 12: Update GenerationJob to completed ──
        logger.debug(`[STEP 12] Updating GenerationJob to completed`);
        const t12 = Date.now();
        await GenerationJob.findByIdAndUpdate(jobRecordId, {
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
        });
        logger.debug(`[STEP 12] GenerationJob updated in ${Date.now() - t12}ms`);

        // ── STEP 13: Emit generation:completed via WebSocket ──
        logger.debug(`[STEP 13] Emitting generation:completed via WebSocket`);
        const t13 = Date.now();
        emitToAssignment(assignmentId, 'generation:completed', {
          assignmentId,
          paperId: savedPaper._id.toString(),
          jobRecordId,
          generationSeq,
          ts: Date.now(),
        });
        logger.debug(`[STEP 13] WebSocket emit done in ${Date.now() - t13}ms`);

        // ── STEP 14: Enqueue PDF generation ──
        logger.debug(`[STEP 14] Enqueuing PDF generation job`);
        const t14 = Date.now();
        try {
          await emit('pdf_composing', 92, 'Composing professional PDF...');
          const pdfQueue = getPdfQueue();
          await pdfQueue.add('generate-pdf', {
            assignmentId,
            paperId: savedPaper._id.toString(),
            jobRecordId,
          });
          logger.debug(`[STEP 14] PDF job enqueued in ${Date.now() - t14}ms`);
        } catch (pdfErr) {
          logger.warn(`[STEP 14] PDF queue add failed (non-fatal): ${pdfErr}`);
        }

        const totalTime = Date.now() - jobStartTime;
        logger.info(`[WORKER:COMPLETE] Job ${job.id} finished in ${totalTime}ms | assignment=${assignmentId} | activeJobs=${activeJobCount}`);
      } catch (error) {
        const elapsed = Date.now() - jobStartTime;
        const message = error instanceof Error ? error.message : 'Unknown error';
        const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 2) - 1;
        logger.error(`[WORKER FAIL] Job ${job.id} failed at ${elapsed}ms (attempt ${job.attemptsMade + 1}, final=${isFinalAttempt}): ${message}`);
        if (error instanceof Error && error.stack) {
          logger.error(`[WORKER FAIL STACK] ${error.stack.split('\n').slice(0, 8).join('\n')}`);
        }

        // Only the active job may mark failure/partial. This prevents late retries from
        // downgrading a completed assignment.
        const owner = await Assignment.findById(assignmentId).select({ activeGenerationJobId: 1, status: 1 }).lean().catch(() => null);
        const isOwner = !!owner && String(owner.activeGenerationJobId ?? '') === String(jobRecordId);
        const isFinalized = owner?.status === 'completed';

        if (!isOwner || isFinalized) {
          logger.warn(
            `[STALE FAIL] Ignoring failure update for assignment=${assignmentId} jobRecord=${jobRecordId} ` +
            `(isOwner=${isOwner}, currentStatus=${owner?.status})`
          );
          throw error;
        }

        if (isFinalAttempt) {
          const { category, userMessage } = classifyError(error instanceof Error ? error : new Error(message));
          logger.debug(`[WORKER FAIL] Final attempt — checking for partial paper`);
          const f0 = Date.now();
          const existingPaper = await GeneratedPaper.findOne({ assignmentId } as any).lean().catch(() => null);
          const hasPartial = !!existingPaper;

          const a = assignment as any;
          const genMeta: GenerationMeta = {
            status: hasPartial ? 'partially_generated' : 'failed',
            generatedQuestionCount: 0,
            requestedQuestionCount: a?.questionConfig?.count ?? 0,
            generatedMarks: 0,
            requestedMarks: a?.totalMarks ?? 0,
            completedBatches: 0,
            failedBatches: 1,
            providerName: null,
            failureCategory: category,
            failureReason: userMessage,
            diagnostics: null,
            partialPaper: existingPaper ? (existingPaper as any).sections : null,
            completedAt: new Date(),
          };
          if (hasPartial) {
            const paperSections = (existingPaper as any).sections || [];
            const pqty = paperSections.reduce((s: number, sec: any) => s + (sec.questions?.length || 0), 0);
            genMeta.generatedQuestionCount = pqty;
            genMeta.generatedMarks = paperSections.reduce((s: number, sec: any) =>
              s + (sec.questions || []).reduce((ms: number, q: any) => ms + (q.marks || 0), 0), 0);
          }

          await Promise.allSettled([
            Assignment.findOneAndUpdate({ _id: assignmentId, activeGenerationJobId: jobRecordId, status: { $ne: 'completed' } }, {
              status: hasPartial ? 'partially_generated' : 'failed',
              generationMeta: genMeta,
            }),
            GenerationJob.findByIdAndUpdate(jobRecordId, {
              status: 'failed',
              error: message,
              completedAt: new Date(),
            }),
          ]);
          logger.debug(`[WORKER FAIL] DB updates done in ${Date.now() - f0}ms | finalStatus=${hasPartial ? 'partially_generated' : 'failed'}`);
          emitToAssignment(assignmentId, hasPartial ? 'generation:completed' : 'generation:failed', {
            assignmentId,
            error: hasPartial ? undefined : userMessage,
            partial: hasPartial,
            retryable: false,
            failureReason: hasPartial ? `Partial: ${userMessage}` : userMessage,
            jobRecordId,
            generationSeq,
            ts: Date.now(),
          });
          logger.debug(`[WORKER FAIL] WebSocket ${hasPartial ? 'generation:completed (partial)' : 'generation:failed'} emitted`);
        } else {
          logger.debug(`[WORKER FAIL] Non-final attempt — requeueing job`);
          await Promise.allSettled([
            Assignment.findOneAndUpdate(
              { _id: assignmentId, activeGenerationJobId: jobRecordId, status: { $ne: 'completed' } },
              { status: 'queued' }
            ),
            GenerationJob.findByIdAndUpdate(jobRecordId, {
              status: 'queued',
              error: message,
            }),
          ]);
          logger.debug(`[WORKER FAIL] Assignment and GenerationJob reset to 'queued' for retry`);
        }

        throw error;
      } finally {
        activeJobCount = Math.max(0, activeJobCount - 1);
      }
    },
    {
      connection: getBullRedisClient(),
      skipVersionCheck: true,
      concurrency: env.AI_WORKER_CONCURRENCY,
      limiter: { max: 5, duration: 60000 },
      // lockDuration MUST exceed the maximum AI generation time.
      // Default is 30s — our AI generation can take up to 120s.
      // Without this, BullMQ's stalled job detector kicks in during
      // legitimate long-running AI calls and corrupts the job state.
      lockDuration: 180_000,
      // stalledInterval: how often BullMQ checks for stalled jobs (ms).
      // Default is 30s. Set high to avoid false positives during AI calls.
      stalledInterval: 120_000,
      // drainDelay: delay before checking for new jobs when queue is empty.
      // Default is 5s. Lower = faster pickup, higher = less Redis polling.
      drainDelay: 5000,
    }
  );

  // ── Worker event handlers for diagnostics ──
  aiWorker.on('active', (job) => {
    logger.debug(`[WORKER:EVENT] active | job=${job.id}`);
  });

  aiWorker.on('completed', (job) => {
    logger.info(`[WORKER:EVENT] completed | job=${job.id}`);
  });

  aiWorker.on('failed', (job, err) => {
    logger.error(`[WORKER:EVENT] failed | job=${job?.id} | error=${err.message}`);
  });

  aiWorker.on('error', (err) => {
    logger.error(`[WORKER:EVENT] error | ${err.message}`);
  });

  aiWorker.on('stalled', async (jobId) => {
    stalledJobCount++;
    const key = String(jobId);
    const perJobCount = (stalledCounts.get(key) ?? 0) + 1;
    stalledCounts.set(key, perJobCount);
    logger.error(`[WORKER:STALL] Job ${jobId} stalled! stalledCount=${stalledJobCount} jobStallCount=${perJobCount}`);

    if (perJobCount < 2) return;

    try {
      const jobRecord = await GenerationJob.findOne({
        bullmqJobId: key,
        status: { $in: ['queued', 'extracting_content', 'topic_preprocessing', 'generation_planning', 'batch_generating', 'validating', 'answer_key_generating', 'pdf_composing', 'persisting', 'pdf-generating'] },
      }).lean();

      if (!jobRecord) return;

      const assignmentId = jobRecord.assignmentId.toString();
      await Promise.allSettled([
        Assignment.findOneAndUpdate(
          { _id: assignmentId, activeGenerationJobId: (jobRecord as any)._id, status: { $ne: 'completed' } },
          { status: 'failed' }
        ),
        GenerationJob.findByIdAndUpdate(jobRecord._id, {
          status: 'failed',
          error: `BullMQ stalled ${perJobCount} times (auto-failed)` ,
          completedAt: new Date(),
        }),
      ]);

      emitToAssignment(assignmentId, 'generation:failed', {
        assignmentId,
        error: `Generation stalled ${perJobCount} times and was auto-failed`,
        retryable: true,
        jobRecordId: String((jobRecord as any)._id ?? ''),
        generationSeq: Number((jobRecord as any).generationSeq ?? 0),
        ts: Date.now(),
      });

      logger.error(`[WORKER:STALL:FAILED] Job ${jobId} auto-failed after repeated stalls`);
    } catch (stallErr) {
      logger.error(`[WORKER:STALL:ERROR] Failed to mark stalled job ${jobId} as failed: ${stallErr}`);
    }
  });

  aiWorker.on('closing', (msg) => {
    logger.info(`[WORKER:EVENT] closing | ${msg}`);
  });

  aiWorker.on('paused', () => {
    logger.warn('[WORKER:EVENT] paused — no jobs will be processed');
  });

  aiWorker.on('resumed', () => {
    logger.info('[WORKER:EVENT] resumed — job processing continuing');
  });

  logger.info('[WORKER] AI generation worker created with LOCAL Redis (BullMQ stable)');
  return aiWorker;
}

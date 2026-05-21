import { Worker } from 'bullmq';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import { getRedisClient } from '../config/redis';
import { Assignment } from '../models/Assignment.model';
import { GenerationJob } from '../models/GenerationJob.model';
import { generatePaper } from '../services/ai.service';
import { savePaper } from '../services/paper.service';
import { getPdfQueue } from '../queues/pdf.queue';
import { emitToAssignment } from '../sockets/socket.server';
import type { GenerationJobData } from '../types/queue.types';
import { logger } from '../utils/logger';

const GENERATION_TIMEOUT_MS = 120_000;

function sanitizeText(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/[^\x20-\x7E\x0A\x0D\x80-\xFF\n\t]/g, '')
    .replace(/\b(?:data:image\/[a-z]+;base64[^\s]+)\b/gi, '[BINARY REMOVED]')
    .replace(/\b(?:https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg))\b/gi, '[URL REMOVED]')
    .replace(/\S*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\b/gi, '[IMAGE REMOVED]')
    .replace(/[\w\-./\\()]+\/(?:[\w\-./() ]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?))/gi, '[PATH REMOVED]')
    .replace(/\bimage\s*\.\s*(png|jpg|jpeg|gif|webp)\b/gi, '[REF REMOVED]')
    .replace(/\(\s*(?:png|jpg|jpeg|gif|webp|svg|bmp|ico)\s*\)/gi, '[FORMAT REMOVED]')
    .slice(0, 8000);
}

async function extractUploadedContent(files: Array<{ path: string; mimeType: string }>): Promise<{ content: string; wasSanitized: boolean }> {
  const texts: string[] = [];
  let wasSanitized = false;
  for (const file of files) {
    try {
      if (file.mimeType === 'application/pdf') {
        const buffer = await fs.readFile(file.path);
        const parsed = await pdfParse(buffer);
        if (parsed.text && parsed.text.trim().length > 0) {
          const raw = parsed.text;
          const clean = sanitizeText(raw);
          if (clean !== raw) wasSanitized = true;
          texts.push(clean);
        }
      } else if (file.mimeType === 'text/plain') {
        const raw = await fs.readFile(file.path, 'utf-8');
        if (raw && raw.trim().length > 0) {
          const clean = sanitizeText(raw);
          if (clean !== raw) wasSanitized = true;
          texts.push(clean);
        }
      }
    } catch (e) {
      logger.warn(`Failed to read uploaded file: ${file.path}`, e);
    }
  }
  const combined = texts.join('\n\n').trim();
  return { content: combined || '', wasSanitized };
}

export function createAiGenerationWorker() {
  return new Worker<GenerationJobData>(
    'generation',
    async (job) => {
      const { assignmentId, jobRecordId } = job.data;

      const jobRecord = await GenerationJob.findById(jobRecordId).lean();
      if (!jobRecord || jobRecord.status === 'failed') {
        throw new Error('Generation job timed out in queue');
      }

      const emit = async (stage: string, progress: number, message?: string) => {
        emitToAssignment(assignmentId, 'generation:progress', {
          assignmentId,
          progress,
          stage,
          message,
        });
        try {
          await GenerationJob.findByIdAndUpdate(jobRecordId, { status: stage, progress }).exec();
        } catch {
          // Fire-and-forget progress updates should not crash the worker
        }
      };

      try {
        // Emit initial progress before any async work
        emitToAssignment(assignmentId, 'generation:progress', {
          assignmentId, progress: 0, stage: 'queued', message: 'Job started...',
        });

        await emit('processing', 5, 'Starting generation...');

        const assignment = await Assignment.findById(assignmentId).lean();
        if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

        await Assignment.findByIdAndUpdate(assignmentId, { status: 'generating' });

        const { content: uploadedContent, wasSanitized } = await extractUploadedContent(
          (assignment.uploadedFiles ?? []).map((f: { path: string; mimeType: string }) => ({ path: f.path, mimeType: f.mimeType }))
        );

        const sanitizeMsg = wasSanitized ? ' (image references removed from upload)' : '';
        await emit('generating', 40, `Generating questions with AI...${sanitizeMsg}`);

        let typeBreakdown: any[] | undefined;
        if ((assignment as any).typeBreakdown) {
          try { typeBreakdown = JSON.parse((assignment as any).typeBreakdown); } catch { /* ignore */ }
        }

        const paper = await withTimeout(
          generatePaper(assignment as any, uploadedContent || undefined, typeBreakdown),
          GENERATION_TIMEOUT_MS
        );

        await emit('parsing', 70, 'Validating AI output...');

        await emit('saving', 85, 'Saving to database...');
        const savedPaper = await savePaper(assignmentId, paper, assignment.duration);

        await Assignment.findByIdAndUpdate(assignmentId, { status: 'completed' });
        await GenerationJob.findByIdAndUpdate(jobRecordId, {
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
        });

        emitToAssignment(assignmentId, 'generation:completed', {
          assignmentId,
          paperId: savedPaper._id.toString(),
        });

        const pdfQueue = getPdfQueue();
        await pdfQueue.add('generate-pdf', {
          assignmentId,
          paperId: savedPaper._id.toString(),
          jobRecordId,
        });

        logger.info(`Generation completed for assignment ${assignmentId}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 2) - 1;
        logger.error(`Generation failed for assignment ${assignmentId} (attempt ${job.attemptsMade + 1}): ${message}`);

        if (isFinalAttempt) {
          await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
          await GenerationJob.findByIdAndUpdate(jobRecordId, {
            status: 'failed',
            error: message,
            completedAt: new Date(),
          });
          emitToAssignment(assignmentId, 'generation:failed', {
            assignmentId,
            error: message,
            retryable: false,
          });
        } else {
          await GenerationJob.findByIdAndUpdate(jobRecordId, {
            status: 'queued',
            error: message,
          });
        }

        throw error;
      }
    },
    {
      connection: getRedisClient(),
      concurrency: 2,
      limiter: { max: 5, duration: 60000 },
    }
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Generation timed out after ${ms}ms`)), ms)
    ),
  ]);
}

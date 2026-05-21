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

async function extractUploadedContent(files: Array<{ path: string; mimeType: string }>): Promise<string> {
  const texts: string[] = [];
  for (const file of files) {
    try {
      if (file.mimeType === 'application/pdf') {
        const buffer = await fs.readFile(file.path);
        const parsed = await pdfParse(buffer);
        texts.push(parsed.text);
      } else if (file.mimeType === 'text/plain') {
        const text = await fs.readFile(file.path, 'utf-8');
        texts.push(text);
      }
    } catch (e) {
      logger.warn(`Failed to read uploaded file: ${file.path}`, e);
    }
  }
  return texts.join('\n\n');
}

export function createAiGenerationWorker() {
  return new Worker<GenerationJobData>(
    'generation',
    async (job) => {
      const { assignmentId, jobRecordId } = job.data;

      const emit = (stage: string, progress: number, message?: string) => {
        emitToAssignment(assignmentId, 'generation:progress', {
          assignmentId,
          progress,
          stage,
          message,
        });
        GenerationJob.findByIdAndUpdate(jobRecordId, { status: stage, progress }).exec();
      };

      try {
        emit('processing', 5, 'Starting generation...');

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

        await Assignment.findByIdAndUpdate(assignmentId, { status: 'generating' });
        emit('generating', 20, 'Preparing AI prompt...');

        // Extract content from uploaded files
        const uploadedContent = await extractUploadedContent(
          assignment.uploadedFiles.map((f) => ({ path: f.path, mimeType: f.mimeType }))
        );

        emit('generating', 40, 'Generating questions with AI...');
        const paper = await generatePaper(assignment, uploadedContent || undefined);

        emit('parsing', 70, 'Validating AI output...');
        // paper is already validated at this point

        emit('saving', 85, 'Saving to database...');
        const savedPaper = await savePaper(assignmentId, paper);

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

        // Enqueue PDF generation
        const pdfQueue = getPdfQueue();
        await pdfQueue.add('generate-pdf', {
          assignmentId,
          paperId: savedPaper._id.toString(),
          jobRecordId,
        });

        logger.info(`Generation completed for assignment ${assignmentId}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Generation failed for assignment ${assignmentId}:`, error);

        await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
        await GenerationJob.findByIdAndUpdate(jobRecordId, {
          status: 'failed',
          error: message,
          completedAt: new Date(),
        });

        emitToAssignment(assignmentId, 'generation:failed', {
          assignmentId,
          error: message,
          retryable: job.attemptsMade < (job.opts.attempts ?? 3) - 1,
        });

        throw error;
      }
    },
    {
      connection: getRedisClient(),
      concurrency: 3,
      limiter: { max: 10, duration: 60000 },
    }
  );
}

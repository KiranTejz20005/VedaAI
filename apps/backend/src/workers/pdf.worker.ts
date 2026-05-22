import { Worker } from 'bullmq';
import { getBullRedisClient } from '../config/redis';
import { GeneratedPaper } from '../models/GeneratedPaper.model';
import { generatePdf } from '../services/pdf.service';
import { updatePaperPdf } from '../services/paper.service';
import type { PdfJobData } from '../types/queue.types';
import { logger } from '../utils/logger';

let pdfWorker: Worker<PdfJobData> | null = null;

export function createPdfWorker() {
  if (pdfWorker) return pdfWorker;

  pdfWorker = new Worker<PdfJobData>(
    'pdf',
    async (job) => {
      const { paperId, assignmentId } = job.data;
      logger.info(`[WORKER:PDF:START] Job ${job.id} | assignment=${assignmentId}`);

      const paper = await GeneratedPaper.findById(paperId);
      if (!paper) {
        logger.warn(`[WORKER:PDF] Paper ${paperId} not found for assignment ${assignmentId}`);
        return;
      }

      const { pdfPath, pdfUrl } = await generatePdf(paper);
      await updatePaperPdf(paperId, pdfPath, pdfUrl);
      logger.info(`[WORKER:PDF:COMPLETE] Job ${job.id} | assignment=${assignmentId} | pdf=${pdfUrl}`);
    },
    {
      connection: getBullRedisClient(),
      concurrency: 2,
      lockDuration: 120_000,
      stalledInterval: 60_000,
      drainDelay: 1000,
    }
  );

  pdfWorker.on('active', (job) => logger.debug(`[WORKER:PDF:EVENT] active | job=${job.id}`));
  pdfWorker.on('completed', (job) => logger.info(`[WORKER:PDF:EVENT] completed | job=${job.id}`));
  pdfWorker.on('failed', (job, err) => logger.error(`[WORKER:PDF:EVENT] failed | job=${job?.id} | ${err.message}`));
  pdfWorker.on('error', (err) => logger.error(`[WORKER:PDF:EVENT] error | ${err.message}`));
  pdfWorker.on('stalled', (jobId) => logger.error(`[WORKER:PDF:STALL] Job ${jobId} stalled!`));
  pdfWorker.on('closing', (msg) => logger.info(`[WORKER:PDF:EVENT] closing | ${msg}`));

  logger.info('[WORKER:PDF] PDF worker created with LOCAL Redis (BullMQ stable)');
  return pdfWorker;
}

import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { GeneratedPaper } from '../models/GeneratedPaper.model';
import { generatePdf } from '../services/pdf.service';
import { updatePaperPdf } from '../services/paper.service';
import type { PdfJobData } from '../types/queue.types';
import { logger } from '../utils/logger';

export function createPdfWorker() {
  return new Worker<PdfJobData>(
    'pdf',
    async (job) => {
      const { paperId, assignmentId } = job.data;

      const paper = await GeneratedPaper.findById(paperId);
      if (!paper) {
        logger.warn(`Paper ${paperId} not found for PDF generation`);
        return;
      }

      const { pdfPath, pdfUrl } = await generatePdf(paper);
      await updatePaperPdf(paperId, pdfPath, pdfUrl);
      logger.info(`PDF ready for assignment ${assignmentId}: ${pdfUrl}`);
    },
    { connection: getRedisClient(), concurrency: 2 }
  );
}

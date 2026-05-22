import { GeneratedPaper, type IGeneratedPaper } from '../models/GeneratedPaper.model';
import type { ValidatedPaper } from '../validators/paper.validator';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export async function savePaper(
  assignmentId: string,
  paper: ValidatedPaper,
  duration?: number
): Promise<IGeneratedPaper> {
  const t0 = Date.now();
  logger.debug(`[savePaper] START | assignmentId=${assignmentId} title="${paper.title}" sections=${paper.sections.length}`);

  // Delete existing paper for this assignment
  logger.debug(`[savePaper] Checking for existing paper...`);
  const existing = await GeneratedPaper.findOneAndDelete({ assignmentId: new mongoose.Types.ObjectId(assignmentId) });
  if (existing) {
    logger.debug(`[savePaper] Deleted existing paper: ${existing._id}`);
    if (existing?.pdfPath) {
      const fs = await import('fs/promises');
      fs.unlink(existing.pdfPath).catch(() => undefined);
    }
  } else {
    logger.debug(`[savePaper] No existing paper to delete`);
  }

  logger.debug(`[savePaper] Creating new GeneratedPaper...`);
  const saved = await GeneratedPaper.create({
    assignmentId: new mongoose.Types.ObjectId(assignmentId),
    title: paper.title,
    totalMarks: paper.totalMarks,
    duration: duration ?? 45,
    sections: paper.sections,
    generatedAt: new Date(),
  });
  logger.info(`[savePaper] COMPLETE in ${Date.now() - t0}ms | id=${saved._id} sections=${saved.sections.length}`);
  return saved;
}

export async function getPaper(assignmentId: string): Promise<IGeneratedPaper | null> {
  return GeneratedPaper.findOne({ assignmentId: new mongoose.Types.ObjectId(assignmentId) });
}

export async function updatePaperPdf(
  paperId: string,
  pdfPath: string,
  pdfUrl: string
): Promise<void> {
  await GeneratedPaper.findByIdAndUpdate(paperId, { pdfPath, pdfUrl });
}

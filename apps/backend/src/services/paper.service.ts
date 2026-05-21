import { GeneratedPaper, type IGeneratedPaper } from '../models/GeneratedPaper.model';
import type { ValidatedPaper } from '../validators/paper.validator';
import mongoose from 'mongoose';

export async function savePaper(
  assignmentId: string,
  paper: ValidatedPaper
): Promise<IGeneratedPaper> {
  const existing = await GeneratedPaper.findOneAndDelete({ assignmentId: new mongoose.Types.ObjectId(assignmentId) });
  if (existing?.pdfPath) {
    // Clean up old PDF file asynchronously
    const fs = await import('fs/promises');
    fs.unlink(existing.pdfPath).catch(() => undefined);
  }

  return GeneratedPaper.create({
    assignmentId: new mongoose.Types.ObjectId(assignmentId),
    title: paper.title,
    totalMarks: paper.totalMarks,
    sections: paper.sections,
    generatedAt: new Date(),
  });
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

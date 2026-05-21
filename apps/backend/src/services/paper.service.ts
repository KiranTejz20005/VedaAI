import { GeneratedPaper, type IGeneratedPaper } from '../models/GeneratedPaper.model';
import type { ValidatedPaper } from '../validators/paper.validator';
import mongoose from 'mongoose';

export async function savePaper(
  assignmentId: string,
  paper: ValidatedPaper,
  duration?: number
): Promise<IGeneratedPaper> {
  const existing = await GeneratedPaper.findOneAndDelete({ assignmentId: new mongoose.Types.ObjectId(assignmentId) });
  if (existing?.pdfPath) {
    const fs = await import('fs/promises');
    fs.unlink(existing.pdfPath).catch(() => undefined);
  }

  return GeneratedPaper.create({
    assignmentId: new mongoose.Types.ObjectId(assignmentId),
    title: paper.title,
    totalMarks: paper.totalMarks,
    duration: duration ?? 45,
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

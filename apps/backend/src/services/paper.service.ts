import prisma from '../config/prisma';
import { validatePaperOrThrow, type ValidatedPaper } from '../validators/paper.validator';
import { logger } from '../utils/logger';
import type { CanonicalPaperMetadata } from '../types/canonical.types';
import { saveToQuestionBank } from './question-bank.service';

export async function savePaper(
  assignmentId: string,
  paper: ValidatedPaper,
  duration?: number,
  canonicalMetadata?: CanonicalPaperMetadata
) {
  const t0 = Date.now();
  const validatedPaper = validatePaperOrThrow(paper);
  logger.debug(`[savePaper] START | assignmentId=${assignmentId} title="${paper.title}" sections=${paper.sections.length}`);

  const existing = await prisma.generatedPaper.findFirst({ where: { assignmentId } });
  if (existing) {
    logger.debug(`[savePaper] Deleted existing paper: ${existing.id}`);
    if (existing.pdfPath) {
      const fs = await import('fs/promises');
      fs.unlink(existing.pdfPath).catch(() => undefined);
    }
    await prisma.generatedPaper.delete({ where: { id: existing.id } });
  } else {
    logger.debug(`[savePaper] No existing paper to delete`);
  }

  logger.debug(`[savePaper] Creating new GeneratedPaper...`);
  const saved = await prisma.generatedPaper.create({
    data: {
      assignmentId,
      title: validatedPaper.title,
      totalMarks: validatedPaper.totalMarks,
      duration: duration ?? 45,
      sections: validatedPaper.sections as any,
      canonicalMetadata: canonicalMetadata as any ?? undefined,
      generatedAt: new Date(),
    },
  });

  // Auto-save generated questions to the central Question Bank
  const subject = canonicalMetadata?.subject || 'General';
  const topic = canonicalMetadata?.className || 'General Topic';
  for (const section of validatedPaper.sections) {
    for (const q of section.questions) {
      try {
        const diffMap: Record<string, 'EASY' | 'MEDIUM' | 'HARD'> = {
          easy: 'EASY',
          medium: 'MEDIUM',
          hard: 'HARD',
        };
        await saveToQuestionBank({
          content: q.question,
          options: (q as any).options || undefined,
          answer: q.answer?.text || undefined,
          hint: (q as any).hint || undefined,
          subject,
          topic,
          difficulty: diffMap[q.difficulty] || 'MEDIUM',
          bloomLevel: 'APPLY', // Default bloom level for generated output
          tags: [subject, q.type],
        });
      } catch (err) {
        logger.warn(`[savePaper] Failed to auto-save question to bank: ${err}`);
      }
    }
  }

  logger.info(`[savePaper] COMPLETE in ${Date.now() - t0}ms | id=${saved.id} sections=${(saved.sections as any[]).length}`);
  return saved;
}


export async function getPaper(assignmentId: string) {
  return prisma.generatedPaper.findFirst({ where: { assignmentId } });
}

export async function updatePaperPdf(
  paperId: string,
  pdfPath: string,
  pdfUrl: string
): Promise<void> {
  await prisma.generatedPaper.update({
    where: { id: paperId },
    data: { pdfPath, pdfUrl },
  });
}

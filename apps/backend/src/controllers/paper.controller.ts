import type { Request, Response } from 'express';
import path from 'path';
import { getPaper } from '../services/paper.service';
import { sendSuccess, sendError } from '../utils/api-response';
import prisma from '../config/prisma';
import { buildCanonicalPaperMetadata } from '../services/canonical-metadata.service';
import { getPdfStorage } from '../services/storage';
import { generateSingleQuestion } from '../services/question-generation.service';
import { getPdfQueue } from '../queues/pdf.queue';
import { logger } from '../utils/logger';

export async function getPaperHandler(req: Request, res: Response): Promise<void> {
  const { assignmentId } = req.params;
  const [paper, assignment] = await Promise.all([
    getPaper(assignmentId),
    prisma.assignment.findUnique({ where: { id: assignmentId } }),
  ]);
  if (!paper) {
    sendError(res, 'Paper not found for this assignment', 404);
    return;
  }
  const canonicalMetadata =
    assignment ? buildCanonicalPaperMetadata(assignment as any, paper as any) : paper.canonicalMetadata;
  sendSuccess(res, { paper, canonicalMetadata });
}

export async function downloadPdfHandler(req: Request, res: Response): Promise<void> {
  const { filename } = req.params;
  const safeName = path.basename(filename);

  try {
    const storage = getPdfStorage();
    const data = await storage.get(safeName);
    if (!data) {
      sendError(res, 'PDF file not found', 404);
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.send(data);
  } catch {
    sendError(res, 'PDF file not found', 404);
  }
}

export async function downloadPdfByAssignmentIdHandler(req: Request, res: Response): Promise<void> {
  const { assignmentId } = req.params;
  try {
    const paper = await prisma.generatedPaper.findFirst({ where: { assignmentId } });
    if (!paper || !paper.pdfUrl) {
      sendError(res, 'PDF not yet available. Generate the paper first.', 404);
      return;
    }

    const filename = path.basename(paper.pdfUrl);
    const storage = getPdfStorage();
    const data = await storage.get(filename);
    if (!data) {
      sendError(res, 'PDF file not found in storage', 404);
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  } catch (err) {
    sendError(res, 'Failed to download PDF', 500);
  }
}

/**
 * PUT /api/v1/papers/:id
 * Save modified paper payload
 */
export async function updatePaperHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { sections, title, totalMarks } = req.body;

  try {
    const paper = await prisma.generatedPaper.findUnique({ where: { id } });
    if (!paper) {
      sendError(res, 'Paper not found', 404);
      return;
    }

    const updated = await prisma.generatedPaper.update({
      where: { id },
      data: {
        sections: sections || paper.sections,
        title: title || paper.title,
        totalMarks: totalMarks !== undefined ? Number(totalMarks) : paper.totalMarks,
      },
    });

    // Re-trigger PDF compilation in background
    try {
      const pdfQueue = getPdfQueue();
      await pdfQueue.add('generate-pdf', {
        assignmentId: paper.assignmentId,
        paperId: paper.id,
        jobRecordId: `edit-${Date.now()}`,
      });
    } catch (err) {
      logger.warn(`[updatePaper] Failed to queue PDF update: ${err}`);
    }

    sendSuccess(res, { paper: updated }, 200, 'Paper updated successfully');
  } catch (err) {
    logger.error(`[updatePaper] Failed: ${err}`);
    sendError(res, 'Failed to update paper', 500);
  }
}

/**
 * POST /api/v1/papers/:id/regenerate-question
 * LLM replace single question inside generated paper
 */
export async function regenerateQuestionHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { sectionIndex, questionIndex, topic, subject, difficulty, bloomLevel, context } = req.body;

  if (sectionIndex === undefined || questionIndex === undefined) {
    sendError(res, 'sectionIndex and questionIndex are required', 400);
    return;
  }

  try {
    const paper = await prisma.generatedPaper.findUnique({ where: { id } });
    if (!paper) {
      sendError(res, 'Paper not found', 404);
      return;
    }

    const sections = JSON.parse(JSON.stringify(paper.sections)) as any[];
    const targetSection = sections[sectionIndex];
    if (!targetSection || !targetSection.questions[questionIndex]) {
      sendError(res, 'Question not found at index', 404);
      return;
    }

    const targetQuestion = targetSection.questions[questionIndex];

    // Request replacement question from AI
    const replacement = await generateSingleQuestion({
      topic: topic || targetSection.title || 'General',
      subject: subject || 'General',
      difficulty: difficulty || targetQuestion.difficulty || 'medium',
      bloomLevel: bloomLevel || 'APPLY',
      context: context || undefined,
    });

    // Swap question details
    targetSection.questions[questionIndex] = {
      id: targetQuestion.id, // Keep original UUID key
      question: replacement.question_text,
      type: targetQuestion.type,
      difficulty: replacement.difficulty.toLowerCase() as any,
      marks: targetQuestion.marks,
      answer: {
        text: replacement.answer,
        explanation: 'AI generated replacement answer',
      },
      options: replacement.options ? replacement.options.map((o: any, idx: number) => {
        const keys = ['A', 'B', 'C', 'D'];
        return {
          key: keys[idx] || 'A',
          text: String(o).replace(/^[A-D]\.\s*/, ''),
        };
      }) : undefined,
    };

    const updated = await prisma.generatedPaper.update({
      where: { id },
      data: { sections },
    });

    // Re-queue PDF compilation
    try {
      const pdfQueue = getPdfQueue();
      await pdfQueue.add('generate-pdf', {
        assignmentId: paper.assignmentId,
        paperId: paper.id,
        jobRecordId: `regen-${Date.now()}`,
      });
    } catch (err) {
      logger.warn(`[regenerateQuestion] Failed to queue PDF updates: ${err}`);
    }

    sendSuccess(res, { paper: updated, newQuestion: targetSection.questions[questionIndex] }, 200, 'Question regenerated successfully');
  } catch (err) {
    logger.error(`[regenerateQuestion] Failed: ${err}`);
    sendError(res, 'Failed to regenerate question', 500);
  }
}

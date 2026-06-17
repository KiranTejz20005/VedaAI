import type { Request, Response } from 'express';
import path from 'path';
import { getPaper } from '../services/paper.service';
import { sendSuccess, sendError } from '../utils/api-response';
import prisma from '../config/prisma';
import { buildCanonicalPaperMetadata } from '../services/canonical-metadata.service';
import { getPdfStorage } from '../services/storage';

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


import type { Request, Response } from 'express';
import path from 'path';
import { getPaper } from '../services/paper.service';
import { sendSuccess, sendError } from '../utils/api-response';
import { Assignment } from '../models/Assignment.model';
import { buildCanonicalPaperMetadata } from '../services/canonical-metadata.service';
import { getPdfStorage } from '../services/storage';

export async function getPaperHandler(req: Request, res: Response): Promise<void> {
  const { assignmentId } = req.params;
  const [paper, assignment] = await Promise.all([
    getPaper(assignmentId),
    Assignment.findById(assignmentId),
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

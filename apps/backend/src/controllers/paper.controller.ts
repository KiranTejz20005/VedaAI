import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { getPaper } from '../services/paper.service';
import { sendSuccess, sendError } from '../utils/api-response';
import { Assignment } from '../models/Assignment.model';
import { buildCanonicalPaperMetadata } from '../services/canonical-metadata.service';

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

  // Sanitize filename to prevent path traversal
  const safeName = path.basename(filename);
  const pdfPath = path.join(process.cwd(), 'uploads', 'pdfs', safeName);

  try {
    await fs.access(pdfPath);
    res.download(pdfPath, safeName);
  } catch {
    sendError(res, 'PDF file not found', 404);
  }
}

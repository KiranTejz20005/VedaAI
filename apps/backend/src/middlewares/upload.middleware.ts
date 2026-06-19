import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const uploadDir = path.resolve(env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = crypto.randomBytes(12).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

function fileFilter(
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const fileExt = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();
  
  const allowedByExtAndMime =
    (fileExt === '.pdf' && (mime === 'application/pdf' || mime === 'application/octet-stream')) ||
    (fileExt === '.txt' && (mime === 'text/plain' || mime === 'application/octet-stream')) ||
    (fileExt === '.docx' && (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mime === 'application/octet-stream'));

  if (allowedByExtAndMime) {
    cb(null, true);
  } else {
    const userId = req.user?.id || 'anonymous';
    const organizationId = req.user?.organizationId || 'no-organization';
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    
    logger.warn({
      action: 'Upload Rejected',
      userId,
      organizationId,
      requestId,
      fileName: file.originalname,
      reason: `File type ${file.mimetype} with extension ${fileExt || '(none)'} is not allowed.`,
      timestamp: new Date().toISOString(),
    });

    cb(new Error(`File type ${file.mimetype} with extension ${fileExt || '(none)'} is not allowed. Only PDF, DOCX, and TXT files are accepted.`));
  }
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Enforce strict 10MB limit
    files: 10,
  },
});

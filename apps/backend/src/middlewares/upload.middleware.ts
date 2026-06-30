import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { env } from '../config/env';
import { logger } from '../utils/logger';

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

const ALLOWED_TYPES: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.txt': ['text/plain'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip', // DOCX files are ZIP archives; some browsers/OSes report this MIME
  ],
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
};

function fileFilter(
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const fileExt = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();
  const allowed = ALLOWED_TYPES[fileExt]?.includes(mime) ?? false;

  if (allowed) {
    cb(null, true);
  } else {
    logger.warn({
      userId: req.user?.id || 'anonymous',
      fileName: file.originalname,
      mime,
      ext: fileExt,
    }, '[Upload] Rejected file — type not allowed');
    cb(new Error('File type not allowed. Only PDF, DOCX, and TXT files are accepted.'));
  }
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB hard limit
    files: 10,
  },
});

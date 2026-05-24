import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { env } from '../config/env';

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
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const fileExt = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();
  const allowedByExtAndMime =
    (fileExt === '.pdf' && (mime === 'application/pdf' || mime === 'application/octet-stream')) ||
    (fileExt === '.txt' && (mime === 'text/plain' || mime === 'application/octet-stream'));

  if (allowedByExtAndMime) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} with extension ${fileExt || '(none)'} is not allowed. Only PDF and TXT files accepted.`));
  }
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 10,
  },
});

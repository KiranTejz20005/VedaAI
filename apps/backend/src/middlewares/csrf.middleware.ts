import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

const COOKIE_NAME = 'XSRF-TOKEN';
const HEADER_NAME = 'x-csrf-token';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const cookieToken = req.cookies[COOKIE_NAME];

  if (SAFE_METHODS.includes(req.method)) {
    if (!cookieToken) {
      const token = generateToken();
      res.cookie(COOKIE_NAME, token, {
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
    }
    next();
    return;
  }

  if (!cookieToken) {
    logger.warn({ ip: req.ip, method: req.method, path: req.path }, '[CSRF] Missing token cookie');
    res.status(403).json({ success: false, error: 'CSRF token missing' });
    return;
  }

  const headerToken = req.headers[HEADER_NAME] as string;
  if (!headerToken || !crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    logger.warn({ ip: req.ip, method: req.method, path: req.path }, '[CSRF] Token mismatch');
    res.status(403).json({ success: false, error: 'CSRF token mismatch' });
    return;
  }

  next();
}

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { logger } from '../utils/logger';

export function errorMiddleware(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Unhandled error:', { message: error.message, stack: error.stack });

  // Handle Zod Schema validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.flatten().fieldErrors,
    });
    return;
  }

  // Handle Multer upload-specific errors
  if (error instanceof multer.MulterError) {
    res.status(400).json({
      success: false,
      error: `File upload failed: ${error.message}`,
      details: error.field ? { [error.field]: [error.message] } : undefined,
    });
    return;
  }

  // Handle custom upload/filter errors thrown in multer fileFilter callback
  if (error.message.includes('Only PDF and TXT') || error.message.includes('not allowed')) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
    return;
  }

  const statusCode = 'statusCode' in error ? (error as { statusCode: number }).statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
  });
}


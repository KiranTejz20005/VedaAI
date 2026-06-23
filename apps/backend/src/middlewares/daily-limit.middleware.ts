import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { DailyLimitService } from '../services/daily-limit.service';
import { logger } from '../config/logger';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        organizationId: string;
      };
    }
  }
}

const dailyLimitService = new DailyLimitService(redis);

/**
 * Middleware to check daily limits for quiz generation
 */
export const checkQuizDailyLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { allowed, remaining, used, limit } = await dailyLimitService.checkLimit(
      req.user.id,
      req.user.role,
      'quiz'
    );

    // Attach to request for later use
    (req as any).dailyLimitStatus = { allowed, remaining, used, limit };

    if (!allowed) {
      logger.warn('[DailyLimit] Quiz limit exceeded', {
        userId: req.user.id,
        role: req.user.role,
        used,
        limit,
      });

      return res.status(429).json({
        error: 'Daily quiz limit exceeded',
        message: `You can create ${limit} mock quizzes per day. You have used ${used} today.`,
        limit,
        used,
        remaining: 0,
        resetAt: new Date(Date.now() + 86400000),
      });
    }

    next();
  } catch (error) {
    logger.error('[DailyLimit] Error checking quiz limit', error);
    next(error);
  }
};

/**
 * Middleware to check daily limits for paper/assignment generation
 */
export const checkPaperDailyLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { allowed, remaining, used, limit } = await dailyLimitService.checkLimit(
      req.user.id,
      req.user.role,
      'paper'
    );

    // Attach to request for later use
    (req as any).dailyLimitStatus = { allowed, remaining, used, limit };

    if (!allowed) {
      logger.warn('[DailyLimit] Paper generation limit exceeded', {
        userId: req.user.id,
        role: req.user.role,
        used,
        limit,
      });

      return res.status(429).json({
        error: 'Daily paper generation limit exceeded',
        message: `You can generate ${limit} question papers per day. You have used ${used} today.`,
        limit,
        used,
        remaining: 0,
        resetAt: new Date(Date.now() + 86400000),
      });
    }

    next();
  } catch (error) {
    logger.error('[DailyLimit] Error checking paper limit', error);
    next(error);
  }
};

/**
 * Middleware to check daily limits for assignment creation
 */
export const checkAssignmentDailyLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { allowed, remaining, used, limit } = await dailyLimitService.checkLimit(
      req.user.id,
      req.user.role,
      'assignment'
    );

    // Attach to request for later use
    (req as any).dailyLimitStatus = { allowed, remaining, used, limit };

    if (!allowed) {
      logger.warn('[DailyLimit] Assignment creation limit exceeded', {
        userId: req.user.id,
        role: req.user.role,
        used,
        limit,
      });

      return res.status(429).json({
        error: 'Daily assignment creation limit exceeded',
        message: `You can create ${limit} assignments per day. You have created ${used} today.`,
        limit,
        used,
        remaining: 0,
        resetAt: new Date(Date.now() + 86400000),
      });
    }

    next();
  } catch (error) {
    logger.error('[DailyLimit] Error checking assignment limit', error);
    next(error);
  }
};

/**
 * Initialize daily limit service with Redis
 */
export function initializeDailyLimitService(): DailyLimitService {
  return dailyLimitService;
}

import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Rate Limiting helper function
async function checkLimit(
  key: string,
  limit: number,
  expirySeconds: number
): Promise<{ allowed: boolean; current: number }> {
  const redis = getRedisClient();
  const current = await redis.get(key);

  if (current && parseInt(current) >= limit) {
    return { allowed: false, current: parseInt(current) };
  }

  const multi = redis.multi();
  multi.incr(key);
  if (!current) {
    multi.expire(key, expirySeconds);
  }
  const results = await multi.exec();
  const val = results ? (results[0][1] as number) : 1;

  return { allowed: true, current: val };
}

// Check cooldown key existence and set it if not present
async function checkAndSetCooldown(key: string, expirySeconds: number): Promise<boolean> {
  const redis = getRedisClient();
  const isLocked = await redis.get(key);
  if (isLocked) {
    return false;
  }
  await redis.set(key, '1', 'EX', expirySeconds);
  return true;
}

export const paperGenerationRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.user?.id || 'anonymous';
  const organizationId = req.user?.organizationId || 'no-organization';
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  const ip = req.ip;

  const now = new Date();
  const timestamp = now.toISOString();

  // 1. IP Burst/Throttling protection (max 60 paper-related requests per minute per IP)
  const ipKey = `limit:paper:ip:${ip}:minute`;
  const ipCheck = await checkLimit(ipKey, 60, 60);
  if (!ipCheck.allowed) {
    logger.warn({
      action: 'Rate Limit Triggered',
      userId,
      organizationId,
      requestId,
      ip,
      limitType: 'IP_BURST_PAPER',
      timestamp,
    });
    res.status(429).json({ success: false, error: 'Too many requests. Please slow down.' });
    return;
  }

  // 2. Cooldown system (1 paper generation every 2 minutes per user)
  const cooldownKey = `cooldown:paper:user:${userId}`;
  const cooldownAllowed = await checkAndSetCooldown(cooldownKey, 120);
  if (!cooldownAllowed) {
    logger.warn({
      action: 'Rate Limit Triggered',
      userId,
      organizationId,
      requestId,
      ip,
      limitType: 'COOLDOWN_USER_PAPER',
      timestamp,
    });
    res.status(429).json({
      success: false,
      error: 'You can only generate one paper every 2 minutes. Please wait before trying again.',
    });
    return;
  }

  // 3. User Hourly Limit (5/hour)
  const userHourKey = `limit:paper:user:${userId}:hour`;
  const userHourCheck = await checkLimit(userHourKey, 5, 3600);
  if (!userHourCheck.allowed) {
    logger.warn({
      action: 'Rate Limit Triggered',
      userId,
      organizationId,
      requestId,
      ip,
      limitType: 'USER_HOURLY_PAPER',
      timestamp,
    });
    res.status(429).json({ success: false, error: 'User rate limit exceeded: 5 papers per hour.' });
    return;
  }

  // 4. User Daily Limit (20/day)
  const userDayKey = `limit:paper:user:${userId}:day`;
  const userDayCheck = await checkLimit(userDayKey, 20, 86400);
  if (!userDayCheck.allowed) {
    logger.warn({
      action: 'Rate Limit Triggered',
      userId,
      organizationId,
      requestId,
      ip,
      limitType: 'USER_DAILY_PAPER',
      timestamp,
    });
    res.status(429).json({ success: false, error: 'User rate limit exceeded: 20 papers per day.' });
    return;
  }

  // 5. User Monthly Limit (100/month)
  const userMonthKey = `limit:paper:user:${userId}:month`;
  const userMonthCheck = await checkLimit(userMonthKey, 100, 2592000);
  if (!userMonthCheck.allowed) {
    logger.warn({
      action: 'Rate Limit Triggered',
      userId,
      organizationId,
      requestId,
      ip,
      limitType: 'USER_MONTHLY_PAPER',
      timestamp,
    });
    res.status(429).json({ success: false, error: 'User rate limit exceeded: 100 papers per month.' });
    return;
  }

  // 6. Organization Daily Limit (100/day)
  if (organizationId && organizationId !== 'no-organization') {
    const orgDayKey = `limit:paper:org:${organizationId}:day`;
    const orgDayCheck = await checkLimit(orgDayKey, 100, 86400);
    if (!orgDayCheck.allowed) {
      logger.warn({
        action: 'Rate Limit Triggered',
        userId,
        organizationId,
        requestId,
        ip,
        limitType: 'ORGANIZATION_DAILY_PAPER',
        timestamp,
      });
      res.status(429).json({ success: false, error: 'Organization rate limit exceeded: 100 papers per day.' });
      return;
    }

    // 7. Organization Monthly Limit (1000/month)
    const orgMonthKey = `limit:paper:org:${organizationId}:month`;
    const orgMonthCheck = await checkLimit(orgMonthKey, 1000, 2592000);
    if (!orgMonthCheck.allowed) {
      logger.warn({
        action: 'Rate Limit Triggered',
        userId,
        organizationId,
        requestId,
        ip,
        limitType: 'ORGANIZATION_MONTHLY_PAPER',
        timestamp,
      });
      res.status(429).json({ success: false, error: 'Organization rate limit exceeded: 1000 papers per month.' });
      return;
    }
  }

  next();
};

export const quizGenerationRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.user?.id || 'anonymous';
  const organizationId = req.user?.organizationId || 'no-organization';
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  const ip = req.ip;

  const now = new Date();
  const timestamp = now.toISOString();

  // 1. IP Burst/Throttling protection (max 60 quiz-related requests per minute per IP)
  const ipKey = `limit:quiz:ip:${ip}:minute`;
  const ipCheck = await checkLimit(ipKey, 60, 60);
  if (!ipCheck.allowed) {
    logger.warn({
      action: 'Rate Limit Triggered',
      userId,
      organizationId,
      requestId,
      ip,
      limitType: 'IP_BURST_QUIZ',
      timestamp,
    });
    res.status(429).json({ success: false, error: 'Too many requests. Please slow down.' });
    return;
  }

  // 2. User Hourly Limit (20/hour)
  const userHourKey = `limit:quiz:user:${userId}:hour`;
  const userHourCheck = await checkLimit(userHourKey, 20, 3600);
  if (!userHourCheck.allowed) {
    logger.warn({
      action: 'Rate Limit Triggered',
      userId,
      organizationId,
      requestId,
      ip,
      limitType: 'USER_HOURLY_QUIZ',
      timestamp,
    });
    res.status(429).json({ success: false, error: 'User rate limit exceeded: 20 quizzes per hour.' });
    return;
  }

  // 3. User Daily Limit
  const role = req.user?.role || 'FACULTY';
  const dailyLimit = role === 'STUDENT' ? 2 : 100;
  
  const userDayKey = `limit:quiz:user:${userId}:day`;
  const userDayCheck = await checkLimit(userDayKey, dailyLimit, 86400);
  if (!userDayCheck.allowed) {
    logger.warn({
      action: 'Rate Limit Triggered',
      userId,
      organizationId,
      requestId,
      ip,
      limitType: 'USER_DAILY_QUIZ',
      timestamp,
    });
    res.status(429).json({ success: false, error: `User rate limit exceeded: ${dailyLimit} quizzes per day.` });
    return;
  }

  // 4. Organization Daily Limit (500/day)
  if (organizationId && organizationId !== 'no-organization') {
    const orgDayKey = `limit:quiz:org:${organizationId}:day`;
    const orgDayCheck = await checkLimit(orgDayKey, 500, 86400);
    if (!orgDayCheck.allowed) {
      logger.warn({
        action: 'Rate Limit Triggered',
        userId,
        organizationId,
        requestId,
        ip,
        limitType: 'ORGANIZATION_DAILY_QUIZ',
        timestamp,
      });
      res.status(429).json({ success: false, error: 'Organization rate limit exceeded: 500 quizzes per day.' });
      return;
    }
  }

  next();
};

export const uploadRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.user?.id || 'anonymous';
  const organizationId = req.user?.organizationId || 'no-organization';
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  const ip = req.ip;

  const now = new Date();
  const timestamp = now.toISOString();

  // User Daily Limit (20 uploads/day)
  const userDayKey = `limit:upload:user:${userId}:day`;
  const userDayCheck = await checkLimit(userDayKey, 20, 86400);
  if (!userDayCheck.allowed) {
    logger.warn({
      action: 'Rate Limit Triggered',
      userId,
      organizationId,
      requestId,
      ip,
      limitType: 'USER_DAILY_UPLOAD',
      timestamp,
    });
    res.status(429).json({ success: false, error: 'User rate limit exceeded: 20 uploads per day.' });
    return;
  }

  next();
};

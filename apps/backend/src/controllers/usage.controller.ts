import { Request, Response } from 'express';
import { getRedisClient } from '../config/redis';
import { DailyLimitService } from '../services/daily-limit.service';
import { logger } from '../utils/logger';

const dailyLimitService = new DailyLimitService(getRedisClient());

/**
 * Get daily usage stats for current user
 * GET /api/usage/daily-stats
 */
export const getDailyStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const stats = await dailyLimitService.getUsageStats(user.id, user.role);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error(error, '[Usage] Error fetching daily stats');
    res.status(500).json({ error: 'Failed to fetch usage stats' });
  }
};

/**
 * Reset usage for a user (admin only)
 * POST /api/usage/reset
 */
export const resetUsage = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { userId, type } = req.body;

    // Check admin permission
    if (admin.role !== 'SUPER_ADMIN' && admin.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    await dailyLimitService.resetUsage(userId, type);

    logger.info({ adminId: admin.id, userId, type }, '[Usage] Reset usage');

    res.json({
      success: true,
      message: `Usage reset for user ${userId}`,
    });
  } catch (error) {
    logger.error(error, '[Usage] Error resetting usage');
    res.status(500).json({ error: 'Failed to reset usage' });
  }
};

/**
 * Get usage stats for any user (admin only)
 * GET /api/usage/stats/:userId
 */
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { userId } = req.params;

    // Check admin permission
    if (admin.role !== 'SUPER_ADMIN' && admin.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    // In a real scenario, we'd query the database for the user's role
    // For now, we'll return the stats without role-specific filtering
    const stats = await dailyLimitService.getUsageStats(userId, 'STUDENT');

    res.json({
      success: true,
      data: stats,
      userId,
    });
  } catch (error) {
    logger.error(error, '[Usage] Error fetching user stats');
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
};

import { Request, Response } from 'express';
import { redis } from '../config/redis';
import { DailyLimitService } from '../services/daily-limit.service';
import { logger } from '../config/logger';

const dailyLimitService = new DailyLimitService(redis);

/**
 * Get daily usage stats for current user
 * GET /api/usage/daily-stats
 */
export const getDailyStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await dailyLimitService.getUsageStats(user.id, user.role);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('[Usage] Error fetching daily stats', error);
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
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    await dailyLimitService.resetUsage(userId, type);

    logger.info('[Usage] Reset usage', { adminId: admin.id, userId, type });

    res.json({
      success: true,
      message: `Usage reset for user ${userId}`,
    });
  } catch (error) {
    logger.error('[Usage] Error resetting usage', error);
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
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
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
    logger.error('[Usage] Error fetching user stats', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
};

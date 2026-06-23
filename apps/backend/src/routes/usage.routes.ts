import { Router } from 'express';
import { getDailyStats, resetUsage, getUserStats } from '../controllers/usage.controller';

const router = Router();

/**
 * Get daily usage stats for current user
 * GET /api/usage/daily-stats
 */
router.get('/daily-stats', getDailyStats);

/**
 * Get usage stats for any user (admin only)
 * GET /api/usage/stats/:userId
 */
router.get('/stats/:userId', getUserStats);

/**
 * Reset usage for a user (admin only)
 * POST /api/usage/reset
 */
router.post('/reset', resetUsage);

export default router;

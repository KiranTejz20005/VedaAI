import { Router } from 'express';
import { getDashboardStats } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// All authenticated users can view their relevant dashboard stats
router.get('/stats', getDashboardStats);

export default router;

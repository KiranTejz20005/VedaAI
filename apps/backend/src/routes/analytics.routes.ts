import { Router } from 'express';
import { 
  getDashboardStats, 
  getStudentStats, 
  getGroupStats, 
  triggerRecommendations 
} from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.use(authenticate);

// All authenticated users can view their relevant dashboard stats
router.get('/stats', asyncHandler(getDashboardStats));
router.get('/student/:studentId', asyncHandler(getStudentStats));
router.get('/group/:groupId', asyncHandler(getGroupStats));
router.post('/recommendations', asyncHandler(triggerRecommendations));

export default router;

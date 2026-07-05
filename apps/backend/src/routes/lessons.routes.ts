import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../security/access-control';
import { PERMISSIONS } from '../security/permissions';
import { 
  generatePlan, 
  getPlans, 
  getPlan, 
  removePlan,
  updatePlan
} from '../controllers/lessons.controller';

const router = Router();

router.use(authenticate);

router.post('/', requirePermission(PERMISSIONS.MANAGE_SYLLABUS), asyncHandler(generatePlan));
router.get('/', asyncHandler(getPlans));
router.get('/:id', asyncHandler(getPlan));
router.put('/:id', requirePermission(PERMISSIONS.MANAGE_SYLLABUS), asyncHandler(updatePlan));
router.delete('/:id', requirePermission(PERMISSIONS.MANAGE_SYLLABUS), asyncHandler(removePlan));

export default router;

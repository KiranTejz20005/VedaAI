import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middlewares/auth.middleware';
import { 
  generatePlan, 
  getPlans, 
  getPlan, 
  removePlan 
} from '../controllers/lessons.controller';

const router = Router();

router.use(authenticate);

router.post('/', asyncHandler(generatePlan));
router.get('/', asyncHandler(getPlans));
router.get('/:id', asyncHandler(getPlan));
router.delete('/:id', asyncHandler(removePlan));

export default router;

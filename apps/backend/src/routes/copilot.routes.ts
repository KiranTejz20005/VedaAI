import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { generateLessonPlan, executeWorkflow, listWorkflows } from '../controllers/copilot.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['TEACHER', 'FACULTY', 'ADMIN']));

router.post('/lesson-plan', asyncHandler(generateLessonPlan));
router.post('/workflow', asyncHandler(executeWorkflow));
router.get('/workflows', asyncHandler(listWorkflows));

export default router;

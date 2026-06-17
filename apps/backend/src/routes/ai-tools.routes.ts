import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { generateRubric, generateLessonPlan, generateFeedback, generateDiagram } from '../controllers/ai-tools.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/rubric', asyncHandler(generateRubric));
router.post('/lesson-plan', asyncHandler(generateLessonPlan));
router.post('/feedback', asyncHandler(generateFeedback));
router.post('/diagram', asyncHandler(generateDiagram));

export default router;

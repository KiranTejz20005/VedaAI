import { Router } from 'express';
import { createAssessment, getAssessments } from '../controllers/assessment.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createAssessmentSchema, getAssessmentsSchema } from '../validators/assessment.validator';

const router = Router();

router.use(authenticate);

router.get('/', validate(getAssessmentsSchema), getAssessments);
router.post('/', requireRole(['FACULTY', 'DEPARTMENT_ADMIN']), validate(createAssessmentSchema), createAssessment);

export default router;

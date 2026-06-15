import { Router } from 'express';
import { createAssessment, getAssessments } from '../controllers/assessment.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAssessments);
router.post('/', requireRole(['FACULTY', 'DEPARTMENT_ADMIN']), createAssessment);

export default router;

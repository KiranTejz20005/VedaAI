import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middlewares/auth.middleware';
import * as StudentController from '../controllers/student.controller';

const router = Router();

router.use(authenticate);

router.get('/dashboard', asyncHandler(StudentController.getDashboard));
router.get('/lessons', asyncHandler(StudentController.getMyLessons));
router.get('/assessments', asyncHandler(StudentController.getMyAssessments));
router.get('/results', asyncHandler(StudentController.getMyResults));

export default router;

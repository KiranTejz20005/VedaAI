import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../security/access-control';
import { PERMISSIONS } from '../security/permissions';
import {
  saveGradingConfig,
  getGradingConfig,
  submitStudentAssignment,
  runAIEvaluation,
  getSubmissionEvaluation,
  manualGradeOverride,
  listSubmissions,
  createRubric,
  listRubrics,
} from '../controllers/grader.controller';

const router = Router();

router.use(authenticate);
router.use(requirePermission(PERMISSIONS.GRADE_ASSESSMENT));

// Rubrics
router.post('/rubrics', asyncHandler(createRubric));
router.get('/rubrics', asyncHandler(listRubrics));

// Assignment Grading Configurations
router.post('/assignments/:assignmentId/config', asyncHandler(saveGradingConfig));
router.get('/assignments/:assignmentId/config', asyncHandler(getGradingConfig));

// Submissions
router.post('/assignments/:assignmentId/submissions', uploadMiddleware.array('files', 1), asyncHandler(submitStudentAssignment));
router.get('/assignments/:assignmentId/submissions', asyncHandler(listSubmissions));

// AI Evaluations & Manual Review Override
router.post('/submissions/:submissionId/evaluate', asyncHandler(runAIEvaluation));
router.get('/submissions/:submissionId/evaluate', asyncHandler(getSubmissionEvaluation));
router.post('/submissions/:submissionId/override', asyncHandler(manualGradeOverride));

export default router;

import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate, requireOrganizationScope } from '../middlewares/auth.middleware';
import { requirePermission } from '../security/access-control';
import { requireRole } from '../security/role.middleware';
import { PERMISSIONS } from '../security/permissions';
import {
  saveGradingConfig,
  getGradingConfig,
  runAIEvaluation,
  getSubmissionEvaluation,
  manualGradeOverride,
  listSubmissions,
  uploadSubmission,
  createRubric,
  listRubrics,
  updateRubric,
  deleteRubric,
} from '../controllers/grader.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);
router.use(requireOrganizationScope());

// Rubrics — faculty/admin only
router.post('/rubrics', requireRole('TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), requirePermission(PERMISSIONS.GRADE_ASSESSMENT), asyncHandler(createRubric));
router.get('/rubrics', requireRole('TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), requirePermission(PERMISSIONS.GRADE_ASSESSMENT), asyncHandler(listRubrics));
router.put('/rubrics/:rubricId', requireRole('TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), requirePermission(PERMISSIONS.GRADE_ASSESSMENT), asyncHandler(updateRubric));
router.delete('/rubrics/:rubricId', requireRole('TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), requirePermission(PERMISSIONS.GRADE_ASSESSMENT), asyncHandler(deleteRubric));


// Assignment grading configuration
router.post('/assignments/:assignmentId/config', requireRole('TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), requirePermission(PERMISSIONS.GRADE_ASSESSMENT), asyncHandler(saveGradingConfig));
router.get('/assignments/:assignmentId/config', requireRole('TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), requirePermission(PERMISSIONS.GRADE_ASSESSMENT), asyncHandler(getGradingConfig));

// Faculty views submissions for grading
router.get('/assignments/:assignmentId/submissions', requireRole('TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), requirePermission(PERMISSIONS.GRADE_ASSESSMENT), asyncHandler(listSubmissions));
router.post('/assignments/:assignmentId/submissions', requireRole('TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), requirePermission(PERMISSIONS.GRADE_ASSESSMENT), uploadMiddleware.single('files'), asyncHandler(uploadSubmission));

// AI evaluation & manual override
router.post('/submissions/:submissionId/evaluate', requireRole('TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), requirePermission(PERMISSIONS.GRADE_ASSESSMENT), asyncHandler(runAIEvaluation));
router.get('/submissions/:submissionId/evaluate', requireRole('TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), requirePermission(PERMISSIONS.GRADE_ASSESSMENT), asyncHandler(getSubmissionEvaluation));
router.post('/submissions/:submissionId/override', requireRole('TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), requirePermission(PERMISSIONS.GRADE_ASSESSMENT), asyncHandler(manualGradeOverride));

export default router;

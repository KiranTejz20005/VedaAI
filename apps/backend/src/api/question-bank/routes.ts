import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { requireRole } from '../../security/role.middleware';
import {
  listQuestions,
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  approveQuestion,
  rejectQuestion,
  listQuestionVersions,
  bulkImportQuestions,
  getQuestionBankStats,
} from './controller';
import {
  idParamSchema,
  listQuestionsQuerySchema,
  createQuestionSchema,
  updateQuestionSchema,
  bulkImportSchema,
} from './validators';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('ADMIN', 'TEACHER'), validate(listQuestionsQuerySchema), asyncHandler(listQuestions));
router.post('/', requireRole('ADMIN', 'TEACHER'), validate(createQuestionSchema), asyncHandler(createQuestion));
router.get('/stats', requireRole('ADMIN', 'TEACHER'), asyncHandler(getQuestionBankStats));
router.get('/:id', requireRole('ADMIN', 'TEACHER'), validate(idParamSchema), asyncHandler(getQuestion));
router.put('/:id', requireRole('ADMIN', 'TEACHER'), validate(updateQuestionSchema), asyncHandler(updateQuestion));
router.delete('/:id', requireRole('ADMIN', 'TEACHER'), validate(idParamSchema), asyncHandler(deleteQuestion));
router.post('/:id/approve', requireRole('ADMIN'), validate(idParamSchema), asyncHandler(approveQuestion));
router.post('/:id/reject', requireRole('ADMIN'), validate(idParamSchema), asyncHandler(rejectQuestion));
router.get('/versions/:id', requireRole('ADMIN', 'TEACHER'), validate(idParamSchema), asyncHandler(listQuestionVersions));
router.post('/bulk-import', requireRole('ADMIN', 'TEACHER'), validate(bulkImportSchema), asyncHandler(bulkImportQuestions));

export default router;

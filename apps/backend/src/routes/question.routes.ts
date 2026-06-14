import { Router } from 'express';
import {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion
} from '../controllers/question.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Apply base authentication to all question routes
router.use(authenticate);

// CRUD routes for Questions
// Any authenticated user can read
router.get('/', getQuestions);
router.get('/:id', getQuestionById);

// Only specific roles can create/update/delete
router.post('/', requireRole(['FACULTY', 'DEPARTMENT_ADMIN']), createQuestion);
router.put('/:id', requireRole(['FACULTY', 'DEPARTMENT_ADMIN']), updateQuestion);
router.delete('/:id', requireRole(['DEPARTMENT_ADMIN', 'INSTITUTION_ADMIN']), deleteQuestion);

export default router;

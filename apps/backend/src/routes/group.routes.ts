import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import {
  getGroups,
  createGroup,
  deleteGroup,
  getStudents,
  addStudent,
  deleteStudent,
  bulkAddStudents,
} from '../controllers/group.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Group CRUD
router.get('/', asyncHandler(getGroups));
router.post('/', asyncHandler(createGroup));
router.delete('/:id', asyncHandler(deleteGroup));

// Student roster management
router.get('/:id/students', asyncHandler(getStudents));
router.post('/:id/students', asyncHandler(addStudent));
router.post('/:id/students/bulk', asyncHandler(bulkAddStudents));
router.delete('/:id/students/:studentId', asyncHandler(deleteStudent));

export default router;

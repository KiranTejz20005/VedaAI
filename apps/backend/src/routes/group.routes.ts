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
import { requirePermission } from '../security/access-control';
import { PERMISSIONS } from '../security/permissions';

const router = Router();

router.use(authenticate);

// Group CRUD
router.get('/', asyncHandler(getGroups));
router.post('/', requirePermission(PERMISSIONS.MANAGE_GROUPS), asyncHandler(createGroup));
router.delete('/:id', requirePermission(PERMISSIONS.MANAGE_GROUPS), asyncHandler(deleteGroup));

// Student roster management
router.get('/:id/students', asyncHandler(getStudents));
router.post('/:id/students', requirePermission(PERMISSIONS.MANAGE_GROUPS), asyncHandler(addStudent));
router.post('/:id/students/bulk', requirePermission(PERMISSIONS.MANAGE_GROUPS), asyncHandler(bulkAddStudents));
router.delete('/:id/students/:studentId', requirePermission(PERMISSIONS.MANAGE_GROUPS), asyncHandler(deleteStudent));

export default router;

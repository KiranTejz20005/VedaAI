import { Router } from 'express';
import { authenticate, authorize as requireRole } from '../middlewares/auth.middleware';
import { markAttendance, getStudentAttendance } from '../controllers/attendance.controller';

const router = Router();

// Student routes
router.get('/student', authenticate, getStudentAttendance);

// Teacher routes
router.post('/mark', authenticate, requireRole(['TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN']), markAttendance);

export default router;

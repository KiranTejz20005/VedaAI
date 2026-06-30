import { Router } from 'express';
import { authenticate, authorize as requireRole } from '../middlewares/auth.middleware';
import { markAttendance, getStudentAttendance, submitLeaveApplication, getLeaveApplications, getAttendanceStatus } from '../controllers/attendance.controller';

const router = Router();

// Student routes
router.get('/student', authenticate, getStudentAttendance);
router.post('/student/leave', authenticate, submitLeaveApplication);
router.get('/student/leave', authenticate, getLeaveApplications);

// Teacher routes
router.post('/mark', authenticate, requireRole(['TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN']), markAttendance);
router.get('/status', authenticate, requireRole(['TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN']), getAttendanceStatus);

export default router;

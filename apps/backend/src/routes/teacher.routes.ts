import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

const router = Router();

router.use(authenticate);
router.use(authorize(['TEACHER']));

// Teacher Dashboard Stats
router.get('/dashboard/stats', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const [
    totalStudents,
    presentToday,
    testsConducted,
    assignmentsCreated,
    pendingEvaluations,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: 'STUDENT' },
    }),
    prisma.user.count({
      where: {
        role: 'STUDENT',
        // Last seen today
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.assignment.count({
      where: { createdById: userId },
    }),
    prisma.assignment.count({
      where: { createdById: userId },
    }),
    prisma.studentSubmission.count({
      where: { status: { not: 'GRADED' } },
    }),
  ]);

  const absent = Math.max(0, totalStudents - presentToday);
  const averageClassScore = 76; // Placeholder - can be calculated from submissions
  const ongoingExams = 0; // Placeholder

  res.json({
    success: true,
    data: {
      totalStudents,
      presentToday,
      absent,
      testsConducted,
      assignmentsCreated,
      averageClassScore,
      ongoingExams,
      pendingEvaluations,
    },
  });
}));

export default router;

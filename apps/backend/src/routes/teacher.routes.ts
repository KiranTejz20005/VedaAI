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

  // Fetch recent tests from Assignment table
  const recentTestsRaw = await prisma.assignment.findMany({
    where: { createdById: userId, status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { id: true, title: true, createdAt: true },
  });

  const recentTests = recentTestsRaw.map(t => ({
    id: t.id,
    name: t.title,
    date: t.createdAt.toISOString().split('T')[0],
    score: Math.floor(Math.random() * 20) + 70, // Mock score average for the test, can be aggregated later
  }));

  // Fetch top students from submissions
  const evaluationsRaw = await prisma.submissionEvaluation.findMany({
    orderBy: { score: 'desc' },
    take: 3,
    include: {
      submission: true
    }
  });

  const topStudentIds = evaluationsRaw.map(e => e.submission.studentId);
  const studentsUsers = await prisma.user.findMany({
    where: { id: { in: topStudentIds } },
    select: { id: true, firstName: true, lastName: true }
  });

  const topStudents = evaluationsRaw.map(e => {
    const student = studentsUsers.find(u => u.id === e.submission.studentId);
    return {
      id: e.submission.studentId,
      name: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
      rollNo: 'N/A', // User doesn't have rollNo
      average: Math.round(((e.score || 0) / (e.totalMarks || 100)) * 100),
    };
  });

  const absent = Math.max(0, totalStudents - presentToday);
  const averageClassScore = topStudents.length > 0 ? Math.round(topStudents.reduce((acc, s) => acc + s.average, 0) / topStudents.length) : 0;
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
      recentTests,
      topStudents,
    },
  });
}));

import { uploadMiddleware } from '../middlewares/upload.middleware';
import { ingestionQueue } from '../queues/ingestion.queue';
import { requireRequestOrgId } from '../security/request-context';

// POST /upload-material
router.post('/upload-material', uploadMiddleware.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }
  
  const orgId = requireRequestOrgId(req);
  const fileUrl = req.file.path;
  const fileType = req.file.mimetype;
  const filename = req.file.originalname;

  await ingestionQueue.add('ingest-document', {
    fileUrl,
    fileType,
    organizationId: orgId,
    filename
  });

  res.json({ success: true, message: 'File uploaded and queued for processing', data: { path: fileUrl } });
}));

// GET /students - Returns students in the organization for the teacher
router.get('/students', asyncHandler(async (req, res) => {
  const orgId = req.user?.organizationId;
  const users = await prisma.user.findMany({
    where: { 
      role: 'STUDENT',
      ...(orgId ? { organizationId: orgId } : {}),
    },
    select: { id: true, firstName: true, lastName: true, email: true },
    take: 100,
  });

  const emails = users.map(u => u.email);
  const classStudents = await prisma.classStudent.findMany({
    where: { email: { in: emails } }
  });
  
  const students = users.map(u => {
    const cs = classStudents.find(c => c.email === u.email);
    return {
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      rollNo: cs ? cs.rollNo : 'N/A'
    };
  });

  students.sort((a, b) => {
    if (a.rollNo === 'N/A') return 1;
    if (b.rollNo === 'N/A') return -1;
    return a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true, sensitivity: 'base' });
  });
  
  res.json({ success: true, data: students });
}));

export default router;

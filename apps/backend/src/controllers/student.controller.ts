import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';

function getOrgId(req: Request): string {
  const orgId = req.user?.activeOrganizationId || req.user?.organizationId;
  if (!orgId) throw new Error('No organization scope');
  return orgId;
}

function getUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) throw new Error('User not authenticated');
  return userId;
}

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const orgId = getOrgId(req);

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: userId },
      include: {
        section: {
          include: { classroom: { select: { name: true } } },
        },
      },
    });

    const assessments = await prisma.assignment.findMany({
      where: { organizationId: orgId, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const submissions = await prisma.studentSubmission.findMany({
      where: { studentId: userId, organizationId: orgId },
      orderBy: { submittedAt: 'desc' },
      include: { evaluations: true },
    });

    const pendingSubmissions = submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW');
    const completedSubmissions = submissions.filter((s) => s.status === 'GRADED' || s.status === 'RESULT_PUBLISHED');

    const recentResults = completedSubmissions.slice(0, 5).map((s) => {
      const evalObj = s.evaluations[0];
      return {
        assignmentId: s.assignmentId,
        score: evalObj?.score || 0,
        totalMarks: evalObj?.totalMarks || 0,
        percentage: evalObj ? (evalObj.score / evalObj.totalMarks) * 100 : 0,
        submittedAt: s.submittedAt,
      };
    });

    res.json({
      success: true,
      data: {
        enrolledClasses: enrollments.map((e) => ({
          sectionId: e.sectionId,
          sectionName: e.section.name,
          className: e.section.classroom?.name || '',
        })),
        availableAssessments: assessments.length,
        pendingSubmissions: pendingSubmissions.length,
        completedItems: completedSubmissions.length,
        recentResults,
      },
    });
  } catch (error: any) {
    logger.error(`[Student:getDashboard] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to load dashboard' });
  }
};

export const getMyLessons = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = getOrgId(req);

    const lessons = await prisma.lessonPlan.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: lessons });
  } catch (error: any) {
    logger.error(`[Student:getMyLessons] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch lessons' });
  }
};

export const getMyAssessments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const orgId = getOrgId(req);

    const submissions = await prisma.studentSubmission.findMany({
      where: { studentId: userId, organizationId: orgId },
      select: { assignmentId: true, status: true, submittedAt: true },
    });

    const assessments = await prisma.assignment.findMany({
      where: { organizationId: orgId, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
    });

    const data = assessments.map((a) => {
      const sub = submissions.find((s) => s.assignmentId === a.id);
      return {
        id: a.id,
        title: a.title,
        subject: a.subject,
        dueDate: a.dueDate,
        totalMarks: a.totalMarks,
        duration: a.duration,
        attemptStatus: sub ? sub.status : 'AVAILABLE',
        submittedAt: sub?.submittedAt || null,
      };
    });

    res.json({ success: true, data });
  } catch (error: any) {
    logger.error(`[Student:getMyAssessments] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch assessments' });
  }
};

export const getMyResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const orgId = getOrgId(req);

    const submissions = await prisma.studentSubmission.findMany({
      where: { studentId: userId, organizationId: orgId, status: { in: ['GRADED', 'RESULT_PUBLISHED'] } },
      orderBy: { submittedAt: 'desc' },
      include: { evaluations: true },
    });

    const data = await Promise.all(
      submissions.map(async (s) => {
        const assignment = await prisma.assignment.findUnique({
          where: { id: s.assignmentId },
          select: { title: true, subject: true, totalMarks: true },
        });
        const evalObj = s.evaluations[0];
        return {
          assignmentId: s.assignmentId,
          title: assignment?.title || '',
          subject: assignment?.subject || '',
          totalMarks: assignment?.totalMarks || 0,
          score: evalObj?.score || 0,
          percentage: evalObj ? (evalObj.score / evalObj.totalMarks) * 100 : 0,
          feedback: evalObj?.generalFeedback || null,
          submittedAt: s.submittedAt,
          gradedAt: evalObj?.createdAt || null,
        };
      })
    );

    res.json({ success: true, data });
  } catch (error: any) {
    logger.error(`[Student:getMyResults] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch results' });
  }
};

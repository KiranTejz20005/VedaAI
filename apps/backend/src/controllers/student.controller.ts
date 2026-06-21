import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import { requireRequestOrgId, getRequestUserId } from '../security/request-context';
import {
  loadAssignmentForRequest,
  assertStudentCanViewAssignment,
  handleAccessError,
  AccessDeniedError,
} from '../security/assignment-access';

const PUBLISHED_STATUSES = ['PUBLISHED', 'ACTIVE'] as const;

function getOrgId(req: Request): string {
  return requireRequestOrgId(req);
}

function getUserId(req: Request): string {
  return getRequestUserId(req);
}

async function getPublishedAssignmentsForStudent(req: Request) {
  const orgId = getOrgId(req);
  const userId = getUserId(req);

  const assessments = await prisma.assignment.findMany({
    where: { organizationId: orgId, status: { in: [...PUBLISHED_STATUSES] } },
    orderBy: { createdAt: 'desc' },
  });

  const visible: typeof assessments = [];
  for (const assignment of assessments) {
    try {
      await assertStudentCanViewAssignment(req, assignment);
      visible.push(assignment);
    } catch (err) {
      if (!(err instanceof AccessDeniedError)) throw err;
    }
  }

  const submissions = await prisma.studentSubmission.findMany({
    where: { studentId: userId, organizationId: orgId },
    select: { assignmentId: true, status: true, submittedAt: true },
  });

  return { assessments: visible, submissions };
}

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: userId },
      include: {
        section: {
          include: { classroom: { select: { name: true } } },
        },
      },
    });

    const { assessments, submissions } = await getPublishedAssignmentsForStudent(req);

    const pendingSubmissions = submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW');
    const completedSubmissions = submissions.filter((s) => s.status === 'GRADED' || s.status === 'RESULT_PUBLISHED');

    const recentResults = await Promise.all(
      completedSubmissions.slice(0, 5).map(async (s) => {
        const submission = await prisma.studentSubmission.findFirst({
          where: { studentId: userId, assignmentId: s.assignmentId },
          include: { evaluations: true },
        });
        const evaluation = submission?.evaluations[0];
        return {
          assignmentId: s.assignmentId,
          score: evaluation?.score || 0,
          totalMarks: evaluation?.totalMarks || 0,
          percentage: evaluation ? (evaluation.score / evaluation.totalMarks) * 100 : 0,
          submittedAt: s.submittedAt,
        };
      }),
    );

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

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assessments, submissions } = await getPublishedAssignmentsForStudent(req);
    const completed = submissions.filter((s) => s.status === 'GRADED' || s.status === 'RESULT_PUBLISHED').length;
    const pending = submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW').length;

    res.json({
      success: true,
      data: {
        totalAssessments: assessments.length,
        completed,
        pending,
        available: assessments.length - completed,
      },
    });
  } catch (error: any) {
    logger.error(`[Student:getStats] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to load stats' });
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
    const { assessments, submissions } = await getPublishedAssignmentsForStudent(req);

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

export const getUpcomingAssessments = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const { assessments, submissions } = await getPublishedAssignmentsForStudent(req);

    const data = assessments
      .filter((a) => new Date(a.dueDate) >= now)
      .filter((a) => {
        const sub = submissions.find((s) => s.assignmentId === a.id);
        return !sub || sub.status === 'AVAILABLE' || sub.status === 'STARTED';
      })
      .slice(0, 10)
      .map((a) => ({
        id: a.id,
        title: a.title,
        subject: a.subject,
        dueDate: a.dueDate,
        totalMarks: a.totalMarks,
      }));

    res.json({ success: true, data });
  } catch (error: any) {
    logger.error(`[Student:getUpcomingAssessments] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch upcoming assessments' });
  }
};

export const startAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await loadAssignmentForRequest(req, req.params.id);
    await assertStudentCanViewAssignment(req, assignment);

    const userId = getUserId(req);
    const orgId = getOrgId(req);

    let submission = await prisma.studentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: userId } },
    });

    if (!submission) {
      submission = await prisma.studentSubmission.create({
        data: {
          assignmentId: assignment.id,
          studentId: userId,
          organizationId: orgId,
          fileUrl: '',
          fileType: 'NONE',
          status: 'STARTED',
        },
      });
    } else if (submission.status === 'AVAILABLE') {
      submission = await prisma.studentSubmission.update({
        where: { id: submission.id },
        data: { status: 'STARTED' },
      });
    }

    res.json({
      success: true,
      data: {
        assignment: {
          id: assignment.id,
          title: assignment.title,
          subject: assignment.subject,
          dueDate: assignment.dueDate,
          duration: assignment.duration,
          totalMarks: assignment.totalMarks,
        },
        attemptStatus: submission.status,
        submissionId: submission.id,
      },
    });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    logger.error(`[Student:startAssessment] ${err}`);
    res.status(500).json({ success: false, error: 'Failed to start assessment' });
  }
};

export const submitAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await loadAssignmentForRequest(req, req.params.id);
    await assertStudentCanViewAssignment(req, assignment);

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: 'No files uploaded' });
      return;
    }

    const userId = getUserId(req);
    const orgId = getOrgId(req);
    const file = files[0];

    if (new Date() > new Date(assignment.dueDate)) {
      res.status(409).json({ success: false, error: 'Due date has passed for this assignment' });
      return;
    }

    const submission = await prisma.studentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: userId } },
      create: {
        assignmentId: assignment.id,
        studentId: userId,
        organizationId: orgId,
        fileUrl: file.path,
        fileType: file.mimetype === 'application/pdf' ? 'PDF' : 'TXT',
        status: 'SUBMITTED',
      },
      update: {
        fileUrl: file.path,
        fileType: file.mimetype === 'application/pdf' ? 'PDF' : 'TXT',
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    res.status(201).json({ success: true, data: submission });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    logger.error(`[Student:submitAssessment] ${err}`);
    res.status(500).json({ success: false, error: 'Failed to submit assignment' });
  }
};

export const getMyResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const orgId = getOrgId(req);

    const submissions = await prisma.studentSubmission.findMany({
      where: { studentId: userId, organizationId: orgId, status: { in: ['GRADED', 'RESULT_PUBLISHED'] } },
      orderBy: { submittedAt: 'desc' },
      include: { evaluations: true, assignment: { select: { title: true, subject: true, totalMarks: true, organizationId: true } } },
    });

    const data = submissions
      .filter((s) => s.assignment.organizationId === orgId)
      .map((s) => {
        const evalObj = s.evaluations[0];
        return {
          id: s.id,
          assignmentId: s.assignmentId,
          title: s.assignment.title,
          subject: s.assignment.subject,
          totalMarks: s.assignment.totalMarks,
          score: evalObj?.score || 0,
          percentage: evalObj ? (evalObj.score / evalObj.totalMarks) * 100 : 0,
          feedback: evalObj?.generalFeedback || null,
          submittedAt: s.submittedAt,
          gradedAt: evalObj?.createdAt || null,
        };
      });

    res.json({ success: true, data });
  } catch (error: any) {
    logger.error(`[Student:getMyResults] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch results' });
  }
};

export const getResultDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const orgId = getOrgId(req);

    const submission = await prisma.studentSubmission.findFirst({
      where: {
        id: req.params.id,
        studentId: userId,
        organizationId: orgId,
        status: { in: ['GRADED', 'RESULT_PUBLISHED'] },
      },
      include: {
        evaluations: true,
        assignment: { select: { title: true, subject: true, totalMarks: true } },
      },
    });

    if (!submission) {
      res.status(404).json({ success: false, error: 'Result not found' });
      return;
    }

    const evalObj = submission.evaluations[0];
    res.json({
      success: true,
      data: {
        id: submission.id,
        assignmentId: submission.assignmentId,
        title: submission.assignment.title,
        subject: submission.assignment.subject,
        totalMarks: submission.assignment.totalMarks,
        score: evalObj?.score || 0,
        percentage: evalObj ? (evalObj.score / evalObj.totalMarks) * 100 : 0,
        feedback: evalObj?.generalFeedback || null,
        criteriaGrades: evalObj?.criteriaGrades || null,
        submittedAt: submission.submittedAt,
        gradedAt: evalObj?.createdAt || null,
      },
    });
  } catch (error: any) {
    logger.error(`[Student:getResultDetail] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch result' });
  }
};

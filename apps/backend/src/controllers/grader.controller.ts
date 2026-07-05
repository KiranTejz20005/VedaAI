import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { evaluateSubmission, extractTextFromFile } from '../services/grader.service';
import {
  assertCanGradeAssignment,
  loadSubmissionScoped,
  handleAccessError,
} from '../security/assignment-access';
import { requireRequestOrgId, getRequestUserId } from '../security/request-context';

export const saveGradingConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    await assertCanGradeAssignment(req, assignmentId);
    const { rubricId, answerKeyText } = req.body;

    const config = await prisma.assignmentGradingConfig.upsert({
      where: { assignmentId },
      create: {
        assignmentId,
        rubricId: rubricId || null,
        answerKeyText: answerKeyText || '',
      },
      update: {
        rubricId: rubricId || null,
        answerKeyText: answerKeyText || '',
      },
    });

    res.json({ success: true, data: config });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: 'Failed to save grading config' });
  }
};

export const getGradingConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    await assertCanGradeAssignment(req, assignmentId);
    const config = await prisma.assignmentGradingConfig.findUnique({
      where: { assignmentId },
      include: { rubric: true },
    });
    res.json({ success: true, data: config });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: 'Failed to fetch grading config' });
  }
};

export const runAIEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const submission = await loadSubmissionScoped(req, req.params.submissionId);
    await assertCanGradeAssignment(req, submission.assignmentId);
    const evaluation = await evaluateSubmission(submission.id);
    res.json({ success: true, data: evaluation });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Evaluation failed' });
  }
};

export const bulkAIEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    await assertCanGradeAssignment(req, assignmentId);

    // Find all un-graded submissions
    const submissions = await prisma.studentSubmission.findMany({
      where: { assignmentId, status: { not: 'GRADED' } },
    });

    if (submissions.length === 0) {
      res.json({ success: true, message: 'No ungraded submissions found.' });
      return;
    }

    const results = [];
    let successes = 0;
    
    // Evaluate sequentially to avoid API rate limits
    for (const sub of submissions) {
      try {
        const evalResult = await evaluateSubmission(sub.id);
        results.push({ submissionId: sub.id, success: true, score: evalResult.score });
        successes++;
      } catch (e: any) {
        results.push({ submissionId: sub.id, success: false, error: e.message });
      }
    }

    res.json({ 
      success: true, 
      message: `Successfully graded ${successes}/${submissions.length} submissions.`,
      data: results 
    });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Bulk evaluation failed' });
  }
};

export const getSubmissionEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const submission = await loadSubmissionScoped(req, req.params.submissionId);
    const evaluation = await prisma.submissionEvaluation.findUnique({
      where: { submissionId: submission.id },
      include: { submission: true },
    });
    
    let studentText = '';
    if (evaluation?.submission) {
      studentText = await extractTextFromFile(evaluation.submission.fileUrl, evaluation.submission.fileType);
    }
    
    const config = await prisma.assignmentGradingConfig.findUnique({
      where: { assignmentId: submission.assignmentId },
      include: { rubric: { include: { criteria: true } } },
    });
    const rubricCriteria = config?.rubric?.criteria || [];
    
    res.json({ success: true, data: { ...evaluation, studentText, rubricCriteria } });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: 'Failed to fetch evaluation' });
  }
};

export const manualGradeOverride = async (req: Request, res: Response): Promise<void> => {
  try {
    const submission = await loadSubmissionScoped(req, req.params.submissionId);
    await assertCanGradeAssignment(req, submission.assignmentId);
    const { overrideScore, reason } = req.body;

    const evaluation = await prisma.submissionEvaluation.findUnique({
      where: { submissionId: submission.id },
    });

    if (!evaluation) {
      res.status(404).json({ success: false, error: 'Evaluation not found' });
      return;
    }

    const updated = await prisma.submissionEvaluation.update({
      where: { submissionId: submission.id },
      data: {
        score: Number(overrideScore),
        teacherOverride: {
          originalScore: evaluation.score,
          overrideScore: Number(overrideScore),
          reason,
          updatedAt: new Date().toISOString(),
          updatedBy: getRequestUserId(req),
        },
      },
    });

    await prisma.studentSubmission.update({
      where: { id: submission.id },
      data: { status: 'GRADED' },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: 'Override failed' });
  }
};

export const listSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    await assertCanGradeAssignment(req, assignmentId);
    requireRequestOrgId(req);

    const submissions = await prisma.studentSubmission.findMany({
      where: { assignmentId },
      include: { evaluations: true },
      orderBy: { submittedAt: 'desc' },
    });

    const submissionsWithUsers = await Promise.all(
      submissions.map(async (sub) => {
        const user = await prisma.user.findUnique({
          where: { id: sub.studentId },
          select: { firstName: true, lastName: true, email: true }
        });
        return {
          ...sub,
          studentName: user ? `${user.firstName} ${user.lastName}`.trim() : sub.studentId
        };
      })
    );

    res.json({ success: true, data: submissionsWithUsers });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: 'Failed to list submissions' });
  }
};

export const uploadSubmission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    await assertCanGradeAssignment(req, assignmentId);
    const orgId = requireRequestOrgId(req);
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const studentId = 'test-student-' + Date.now().toString(); 

    const fileUrl = file.path;

    const submission = await prisma.studentSubmission.create({
      data: {
        assignmentId,
        studentId,
        organizationId: orgId,
        fileUrl,
        fileType: file.mimetype,
        status: 'SUBMITTED',
      },
    });

    res.status(201).json({ success: true, data: submission });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: 'Failed to upload submission' });
  }
};

export const createRubric = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, criteria } = req.body;
    const authorId = getRequestUserId(req);
    const organizationId = requireRequestOrgId(req);

    const rubric = await prisma.rubric.create({
      data: {
        title,
        description,
        authorId,
        organizationId,
        criteria: {
          create: criteria.map((c: any) => ({
            name: c.name,
            description: c.description,
            maxMarks: Number(c.maxMarks) || 10,
          })),
        },
      },
      include: { criteria: true },
    });

    res.status(201).json({ success: true, data: rubric });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create rubric' });
  }
};

export const listRubrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = requireRequestOrgId(req);
    const rubrics = await prisma.rubric.findMany({
      where: { organizationId },
      include: { criteria: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: rubrics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list rubrics' });
  }
};

export const updateRubric = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = requireRequestOrgId(req);
    const { rubricId } = req.params;
    const { title, description, criteria } = req.body;
    
    // Ensure it belongs to org
    const existing = await prisma.rubric.findFirst({ where: { id: rubricId, organizationId } });
    if (!existing) {
       res.status(404).json({ success: false, error: 'Rubric not found' });
       return;
    }

    const updated = await prisma.rubric.update({
      where: { id: rubricId },
      data: {
        title,
        description,
        criteria: {
          deleteMany: {},
          create: criteria.map((c: any) => ({
            name: c.name,
            description: c.description,
            maxMarks: Number(c.maxMarks) || 10,
          })),
        }
      },
      include: { criteria: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update rubric' });
  }
};

export const deleteRubric = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = requireRequestOrgId(req);
    const { rubricId } = req.params;

    const existing = await prisma.rubric.findFirst({ where: { id: rubricId, organizationId } });
    if (!existing) {
       res.status(404).json({ success: false, error: 'Rubric not found' });
       return;
    }

    await prisma.rubric.delete({ where: { id: rubricId } });
    res.json({ success: true, message: 'Rubric deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete rubric' });
  }
};

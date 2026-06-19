import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { evaluateSubmission } from '../services/grader.service';

export const saveGradingConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
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
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save grading config' });
  }
};

export const getGradingConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const config = await prisma.assignmentGradingConfig.findUnique({
      where: { assignmentId },
      include: { rubric: true },
    });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch grading config' });
  }
};

export const submitStudentAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: 'No files uploaded' });
      return;
    }

    const file = files[0];
    const studentId = req.user?.id || 'demo-student-id';

    const submission = await prisma.studentSubmission.create({
      data: {
        assignmentId,
        studentId,
        organizationId: req.user?.organizationId || req.body._requireOrganizationScope || 'no-organization',
        fileUrl: file.path,
        fileType: file.mimetype === 'application/pdf' ? 'PDF' : 'TXT',
        status: 'SUBMITTED',
      },
    });

    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to submit assignment' });
  }
};

export const runAIEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const evaluation = await evaluateSubmission(submissionId);
    res.json({ success: true, data: evaluation });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Evaluation failed' });
  }
};

export const getSubmissionEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const evaluation = await prisma.submissionEvaluation.findUnique({
      where: { submissionId },
      include: { submission: true },
    });
    res.json({ success: true, data: evaluation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch evaluation' });
  }
};

export const manualGradeOverride = async (req: Request, res: Response): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const { overrideScore, reason } = req.body;

    const evaluation = await prisma.submissionEvaluation.findUnique({
      where: { submissionId },
    });

    if (!evaluation) {
      res.status(404).json({ success: false, error: 'Evaluation not found' });
      return;
    }

    const updated = await prisma.submissionEvaluation.update({
      where: { submissionId },
      data: {
        score: Number(overrideScore),
        teacherOverride: {
          originalScore: evaluation.score,
          overrideScore: Number(overrideScore),
          reason,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    await prisma.studentSubmission.update({
      where: { id: submissionId },
      data: { status: 'GRADED' }, // Using GRADED instead of REVIEWED
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Override failed' });
  }
};

export const listSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const submissions = await prisma.studentSubmission.findMany({
      where: { assignmentId },
      include: { evaluations: true },
      orderBy: { submittedAt: 'desc' },
    });
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list submissions' });
  }
};

export const createRubric = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, criteria } = req.body;
    const authorId = req.user?.id || 'demo-faculty-id';

    const rubric = await prisma.rubric.create({
      data: {
        title,
        description,
        authorId,
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

export const listRubrics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rubrics = await prisma.rubric.findMany({
      include: { criteria: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: rubrics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list rubrics' });
  }
};

import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const createAssessment = async (req: Request, res: Response) => {
  try {
    const { title, subjectId, totalMarks } = req.body;
    // @ts-ignore
    const authorId = req.user?.id || 'demo-author-id';
    
    const assessment = await prisma.assessment.create({
      data: {
        title,
        subjectId,
        totalMarks: parseInt(totalMarks) || 100,
        authorId,
        status: 'DRAFT'
      }
    });

    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to create assessment' });
  }
};

export const getAssessments = async (req: Request, res: Response) => {
  try {
    const assessments = await prisma.assessment.findMany({
      include: {
        author: { select: { firstName: true, lastName: true } },
        _count: { select: { questions: true } }
      }
    });
    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch assessments' });
  }
};

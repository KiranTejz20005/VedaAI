import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { 
  getStudentPerformance, 
  getGroupPerformance, 
  generateAIRecommendations 
} from '../services/analytics.service';

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const totalQuestions = await prisma.question.count();
    const totalAssessments = await prisma.assignment.count();
    const pendingReviews = await prisma.questionReview.count({ where: { status: 'PENDING' } });

    const bloomDistribution = await prisma.question.groupBy({
      by: ['bloomLevel'],
      _count: { bloomLevel: true }
    });

    const difficultyDistribution = await prisma.question.groupBy({
      by: ['difficulty'],
      _count: { difficulty: true }
    });

    const bloomData = bloomDistribution.map((b: any) => ({
      level: b.bloomLevel,
      count: b._count.bloomLevel
    }));

    const difficultyData = difficultyDistribution.map((d: any) => ({
      level: d.difficulty,
      count: d._count.difficulty
    }));

    res.json({
      success: true,
      data: {
        totals: {
          questions: totalQuestions,
          assessments: totalAssessments,
          pendingReviews: pendingReviews
        },
        bloomDistribution: bloomData,
        difficultyDistribution: difficultyData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
};

export const getStudentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const stats = await getStudentPerformance(studentId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get student stats' });
  }
};

export const getGroupStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const stats = await getGroupPerformance(groupId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get group stats' });
  }
};

export const triggerRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetId, type } = req.body;
    if (!targetId || !type) {
      res.status(400).json({ success: false, error: 'targetId and type are required' });
      return;
    }
    const rec = await generateAIRecommendations(targetId, type);
    res.json({ success: true, data: rec });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
};

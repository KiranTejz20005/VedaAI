import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AnalyticsService } from '../services/analytics.service';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const totalQuestions = await prisma.questionBank.count({
      where: { organizationId: orgId }
    });
    
    const totalAssessments = await prisma.assignment.count({
      where: { organizationId: orgId }
    });
    
    // Instead of pendingReviews, we can count pending student submissions
    const pendingReviews = await prisma.studentSubmission.count({ 
      where: { status: { not: 'GRADED' } } 
    });

    const bloomDistribution = await prisma.questionBank.groupBy({
      by: ['bloomLevel'],
      where: { organizationId: orgId },
      _count: { bloomLevel: true }
    });

    const difficultyDistribution = await prisma.questionBank.groupBy({
      by: ['difficulty'],
      where: { organizationId: orgId },
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch analytics' });
  }
};

export const getStudentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const stats = await AnalyticsService.getStudentPerformance(studentId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get student stats' });
  }
};

export const getGroupStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const stats = await AnalyticsService.getGroupPerformance(groupId);
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
    const rec = await AnalyticsService.generateAIRecommendations(targetId, type);
    res.json({ success: true, data: rec });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
};

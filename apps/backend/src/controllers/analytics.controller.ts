import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // 1. Get total counts
    const totalQuestions = await prisma.question.count();
    const totalAssessments = await prisma.assessment.count();
    const pendingReviews = await prisma.questionReview.count({ where: { status: 'PENDING' } }); // Example pseudo-status

    // 2. Group by Bloom Level
    const bloomDistribution = await prisma.question.groupBy({
      by: ['bloomLevel'],
      _count: { bloomLevel: true }
    });

    // 3. Group by Difficulty
    const difficultyDistribution = await prisma.question.groupBy({
      by: ['difficulty'],
      _count: { difficulty: true }
    });

    // In MVP if db is empty, return some placeholder data for the charts
    const bloomData = bloomDistribution.length > 0 ? bloomDistribution.map(b => ({
      level: b.bloomLevel,
      count: b._count.bloomLevel
    })) : [
      { level: 'REMEMBER', count: 120 },
      { level: 'UNDERSTAND', count: 85 },
      { level: 'APPLY', count: 150 },
      { level: 'ANALYZE', count: 90 },
      { level: 'EVALUATE', count: 40 },
      { level: 'CREATE', count: 15 }
    ];

    const difficultyData = difficultyDistribution.length > 0 ? difficultyDistribution.map(d => ({
      level: d.difficulty,
      count: d._count.difficulty
    })) : [
      { level: 'EASY', count: 200 },
      { level: 'MEDIUM', count: 180 },
      { level: 'HARD', count: 120 }
    ];

    res.json({
      success: true,
      data: {
        totals: {
          questions: totalQuestions || 500,
          assessments: totalAssessments || 25,
          pendingReviews: pendingReviews || 12
        },
        bloomDistribution: bloomData,
        difficultyDistribution: difficultyData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
};

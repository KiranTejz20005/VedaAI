import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // 1. Get total counts
    const totalQuestions = await prisma.question.count();
    const totalAssessments = await prisma.assignment.count();
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

    const bloomData = bloomDistribution.map(b => ({
      level: b.bloomLevel,
      count: b._count.bloomLevel
    }));

    const difficultyData = difficultyDistribution.map(d => ({
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

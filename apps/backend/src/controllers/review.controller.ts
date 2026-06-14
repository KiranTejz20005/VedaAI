import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const submitReview = async (req: Request, res: Response) => {
  try {
    const { questionId, status, comments } = req.body;
    // @ts-ignore
    const reviewerId = req.user?.id || 'demo-reviewer-id';
    
    const review = await prisma.questionReview.create({
      data: {
        questionId,
        reviewerId,
        status, // APPROVED, REJECTED, CHANGES_REQUESTED
        comments
      }
    });

    if (status === 'APPROVED') {
      await prisma.question.update({
        where: { id: questionId },
        data: { isPublished: true }
      });
    }

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to submit review' });
  }
};

export const getReviewsForQuestion = async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.questionReview.findMany({
      where: { questionId: req.params.questionId },
      include: { reviewer: { select: { firstName: true, lastName: true, role: true } } }
    });
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
};

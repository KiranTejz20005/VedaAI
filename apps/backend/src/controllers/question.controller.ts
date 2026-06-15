import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const createQuestion = async (req: Request, res: Response) => {
  try {
    const { content, options, answer, subjectId, unitId, difficulty, bloomLevel, authorId } = req.body;
    
    // Fallback for MVP if no authorId provided
    const author = authorId || "temp-author-id"; // In real scenario, extract from req.user
    
    const question = await prisma.question.create({
      data: {
        content,
        options,
        answer,
        subjectId,
        unitId,
        difficulty,
        bloomLevel,
        author: {
            connectOrCreate: {
                where: { id: author },
                create: {
                    id: author,
                    email: 'test@example.com',
                    passwordHash: 'dummy',
                    firstName: 'Test',
                    lastName: 'User'
                }
            }
        }
      }
    });
    
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to create question' });
  }
};

export const getQuestions = async (req: Request, res: Response) => {
  try {
    const questions = await prisma.question.findMany({
      include: {
        author: { select: { firstName: true, lastName: true } }
      }
    });
    res.json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch questions' });
  }
};

export const getQuestionById = async (req: Request, res: Response) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { firstName: true, lastName: true } }
      }
    });
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    res.json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch question' });
  }
};

export const updateQuestion = async (req: Request, res: Response) => {
  try {
    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update question' });
  }
};

export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    await prisma.question.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete question' });
  }
};

import { Request, Response } from 'express';
import { generateSingleQuestion } from '../services/question-generation.service';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';

export const generateQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic, subject, difficulty, bloomLevel, context } = req.body;

    if (!topic || !subject) {
      res.status(400).json({ success: false, error: 'Topic and subject are required' });
      return;
    }

    const question = await generateSingleQuestion({
      topic,
      subject,
      difficulty: difficulty || 'MEDIUM',
      bloomLevel: bloomLevel || 'APPLY',
      context: context || undefined,
    });

    // Persist to DB so questions survive localStorage clears
    try {
      const userId = (req as any).user?.id || 'demo-faculty-id';
      await prisma.question.upsert({
        where: { id: question.id },
        create: {
          id: question.id,
          content: question.question_text,
          options: question.options as any,
          answer: question.answer,
          difficulty: (difficulty || 'MEDIUM') as any,
          bloomLevel: (bloomLevel || 'APPLY') as any,
          author: {
            connectOrCreate: {
              where: { id: userId },
              create: {
                id: userId,
                email: 'demo@bloomverify.com',
                passwordHash: 'demo-hash',
                firstName: 'Demo',
                lastName: 'User',
              },
            },
          },
          isPublished: false,
        },
        update: {},
      });
    } catch (dbErr) {
      // Non-fatal: log but still return the question
      logger.warn(`[generateQuestion] Failed to persist question to DB: ${dbErr instanceof Error ? dbErr.message : dbErr}`);
    }

    res.status(201).json({ success: true, data: question });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate question';
    if (message.includes('AI provider') || message.includes('API key')) {
      res.status(503).json({ success: false, error: message });
    } else {
      res.status(500).json({ success: false, error: message });
    }
  }
};

/**
 * POST /api/v1/generate/session
 * Persist a completed quiz session (questions + score + attempts) to the database.
 */
export const saveQuizSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      topic,
      subject,
      difficulty,
      bloomLevel,
      timeLimitSeconds,
      timeTakenSeconds,
      score,
      attempts,
      questions,
    } = req.body;

    if (!topic || !subject || !Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ success: false, error: 'topic, subject and questions are required' });
      return;
    }

    const userId = (req as any).user?.id || 'demo-faculty-id';

    const session = await prisma.quizSession.create({
      data: {
        topic,
        subject,
        difficulty: difficulty || 'MEDIUM',
        bloomLevel: bloomLevel || 'APPLY',
        timeLimitSeconds: Number(timeLimitSeconds) || questions.length * 60,
        timeTakenSeconds: Number(timeTakenSeconds) || 0,
        totalQuestions: questions.length,
        score: Number(score) || 0,
        attempts: attempts || {},
        userId,
        questions: {
          create: questions.map((q: any, idx: number) => ({
            questionIndex: idx,
            questionText: q.question_text,
            options: q.options || [],
            answer: q.answer || '',
            difficulty: q.difficulty || difficulty || 'MEDIUM',
            bloomLevel: q.bloomLevel || bloomLevel || 'APPLY',
            aiConfidenceScore: q.ai_confidence_score || 0.85,
          })),
        },
      },
      include: { questions: true },
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    logger.error(`[saveQuizSession] ${error instanceof Error ? error.message : error}`);
    res.status(500).json({ success: false, error: 'Failed to save quiz session' });
  }
};

/**
 * GET /api/v1/generate/history
 * List all quiz sessions for the current user, newest first.
 */
export const getQuizHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || 'demo-faculty-id';
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

    const sessions = await prisma.quizSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        questions: {
          orderBy: { questionIndex: 'asc' },
        },
      },
    });

    res.json({ success: true, data: sessions });
  } catch (error) {
    logger.error(`[getQuizHistory] ${error instanceof Error ? error.message : error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch quiz history' });
  }
};

/**
 * DELETE /api/v1/generate/history
 * Clear all quiz sessions for the current user.
 */
export const clearQuizHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || 'demo-faculty-id';

    await prisma.quizSession.deleteMany({ where: { userId } });

    res.json({ success: true, message: 'Quiz history cleared' });
  } catch (error) {
    logger.error(`[clearQuizHistory] ${error instanceof Error ? error.message : error}`);
    res.status(500).json({ success: false, error: 'Failed to clear quiz history' });
  }
};


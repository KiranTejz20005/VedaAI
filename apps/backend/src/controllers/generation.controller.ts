import { Request, Response } from 'express';
import { generateSingleQuestion } from '../services/question-generation.service';

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

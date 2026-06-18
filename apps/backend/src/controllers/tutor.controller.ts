import { Request, Response } from 'express';
import { getTutorResponse, ChatMessage } from '../services/tutor.service';

export const chatWithTutor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { history } = req.body;
    if (!Array.isArray(history)) {
      res.status(400).json({ success: false, error: 'history array is required' });
      return;
    }

    const tutorMessage = await getTutorResponse(history as ChatMessage[]);
    res.json({ success: true, data: tutorMessage });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Tutor chat failed' });
  }
};

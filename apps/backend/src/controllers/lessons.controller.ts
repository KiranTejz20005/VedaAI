import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { 
  createLessonPlan, 
  listUserLessonPlans, 
  getLessonPlanDetails, 
  deleteLessonPlan 
} from '../services/lessons.service';
import prisma from '../config/prisma';

export const generatePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, subject, grade, duration, objectives } = req.body;
    if (!title || !subject || !grade || !duration || !objectives) {
      res.status(400).json({ success: false, error: 'All fields are required' });
      return;
    }
    const userId = req.user?.id || 'demo-faculty-id';
    
    const plan = await createLessonPlan({
      title,
      subject,
      grade,
      duration,
      objectives,
      userId,
    });
    
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    logger.error(`[generatePlan] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to generate lesson plan' });
  }
};

export const getPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 'demo-faculty-id';
    const plans = await listUserLessonPlans(userId);
    res.json({ success: true, data: plans });
  } catch (error) {
    logger.error(`[getPlans] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch lesson plans' });
  }
};

export const getPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const plan = await getLessonPlanDetails(id);
    if (!plan) {
      res.status(404).json({ success: false, error: 'Lesson plan not found' });
      return;
    }
    res.json({ success: true, data: plan });
  } catch (error) {
    logger.error(`[getPlan] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch lesson plan details' });
  }
};

export const removePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteLessonPlan(id);
    res.json({ success: true, message: 'Lesson plan deleted' });
  } catch (error) {
    logger.error(`[removePlan] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to delete lesson plan' });
  }
};

export const updatePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, subject, grade, duration, objectives, content } = req.body;
    
    // In a real app we'd check ownership here via userId from req.user
    const updated = await prisma.lessonPlan.update({
      where: { id },
      data: {
        title: title ?? undefined,
        subject: subject ?? undefined,
        grade: grade ?? undefined,
        duration: duration ?? undefined,
        objectives: objectives ?? undefined,
        content: content ?? undefined
      }
    });
    
    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error(`[updatePlan] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update lesson plan' });
  }
};

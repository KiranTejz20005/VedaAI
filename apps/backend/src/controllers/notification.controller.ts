import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get unread count' });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const notification = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    if (notification.count === 0) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    res.json({ success: true, data: { success: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true, data: { success: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to mark all as read' });
  }
};

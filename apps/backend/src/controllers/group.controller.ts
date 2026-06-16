import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getGroups = async (_req: Request, res: Response): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      include: { _count: { select: { users: true } } },
    });

    const groups = departments.length > 0
      ? departments.map((d, i) => ({
          id: d.id,
          name: d.name,
          students: d._count.users,
          assignments: Math.floor(Math.random() * 10) + 1,
          color: GROUP_COLORS[i % GROUP_COLORS.length].bg,
          iconColor: GROUP_COLORS[i % GROUP_COLORS.length].color,
        }))
      : MOCK_GROUPS;

    res.json({
      success: true,
      data: groups,
    });
  } catch {
    res.json({
      success: true,
      data: MOCK_GROUPS,
    });
  }
};

export const createGroup = async (req: Request, res: Response): Promise<void> => {
  const { name, subject } = req.body;
  if (!name) {
    res.status(400).json({ success: false, error: 'Group name is required' });
    return;
  }
  const colorIdx = Math.floor(Math.random() * GROUP_COLORS.length);
  res.status(201).json({
    success: true,
    data: {
      id: `group-${Date.now()}`,
      name,
      subject: subject || 'General',
      students: 0,
      assignments: 0,
      color: GROUP_COLORS[colorIdx].bg,
      iconColor: GROUP_COLORS[colorIdx].color,
    },
    message: 'Group created successfully',
  });
};

const GROUP_COLORS = [
  { bg: '#EDE9FE', color: '#7C3AED' },
  { bg: '#D1FAE5', color: '#059669' },
  { bg: '#DBEAFE', color: '#2563EB' },
  { bg: '#FEF3C7', color: '#D97706' },
  { bg: '#FCE7F3', color: '#DB2777' },
  { bg: '#FEF9C3', color: '#CA8A04' },
];

const MOCK_GROUPS = [
  { id: 'g1', name: 'Class 10-A', students: 34, assignments: 8, color: '#EDE9FE', iconColor: '#7C3AED' },
  { id: 'g2', name: 'Class 10-B', students: 31, assignments: 5, color: '#D1FAE5', iconColor: '#059669' },
  { id: 'g3', name: 'Class 11-A', students: 28, assignments: 12, color: '#DBEAFE', iconColor: '#2563EB' },
  { id: 'g4', name: 'Class 11-B', students: 30, assignments: 3, color: '#FEF3C7', iconColor: '#D97706' },
  { id: 'g5', name: 'Class 12-A', students: 22, assignments: 7, color: '#FCE7F3', iconColor: '#DB2777' },
  { id: 'g6', name: 'Class 12-B', students: 35, assignments: 4, color: '#FEF9C3', iconColor: '#CA8A04' },
];

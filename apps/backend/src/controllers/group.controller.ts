import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';

const DEFAULT_USER_ID = 'demo-faculty-id';

function getUserId(req: Request): string {
  return (req as any).user?.id || DEFAULT_USER_ID;
}

const GROUP_COLORS = [
  { bg: '#EDE9FE', color: '#7C3AED' },
  { bg: '#D1FAE5', color: '#059669' },
  { bg: '#DBEAFE', color: '#2563EB' },
  { bg: '#FEF3C7', color: '#D97706' },
  { bg: '#FCE7F3', color: '#DB2777' },
  { bg: '#FEF9C3', color: '#CA8A04' },
];

// ── List all groups ──
export const getGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const groups = await prisma.classGroup.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { students: true } } },
    });

    const data = groups.map((g, i) => ({
      id: g.id,
      name: g.name,
      subject: g.subject,
      students: g._count.students,
      assignments: 0, // future: join with assignment table
      color: GROUP_COLORS[i % GROUP_COLORS.length].bg,
      iconColor: GROUP_COLORS[i % GROUP_COLORS.length].color,
    }));

    res.json({ success: true, data });
  } catch (error) {
    logger.error(`[getGroups] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch groups' });
  }
};

// ── Create group ──
export const createGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, subject } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Group name is required' });
      return;
    }
    const userId = getUserId(req);

    const group = await prisma.classGroup.create({
      data: { name, subject: subject || 'General', userId },
      include: { _count: { select: { students: true } } },
    });

    const count = await prisma.classGroup.count({ where: { userId } });
    const colorIdx = (count - 1) % GROUP_COLORS.length;

    res.status(201).json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        subject: group.subject,
        students: 0,
        assignments: 0,
        color: GROUP_COLORS[colorIdx].bg,
        iconColor: GROUP_COLORS[colorIdx].color,
      },
      message: 'Group created successfully',
    });
  } catch (error) {
    logger.error(`[createGroup] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to create group' });
  }
};

// ── Delete group ──
export const deleteGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.classGroup.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Group deleted' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Group not found' });
      return;
    }
    logger.error(`[deleteGroup] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to delete group' });
  }
};

// ── Get students in a group ──
export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await prisma.student.findMany({
      where: { groupId: req.params.id },
      orderBy: { joinedAt: 'asc' },
    });
    res.json({ success: true, data: students });
  } catch (error) {
    logger.error(`[getStudents] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch students' });
  }
};

// ── Add student to group ──
export const addStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, rollNo, email } = req.body;
    if (!name || !rollNo || !email) {
      res.status(400).json({ success: false, error: 'name, rollNo, and email are required' });
      return;
    }
    const student = await prisma.student.create({
      data: { groupId: req.params.id, name, rollNo, email },
    });
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    logger.error(`[addStudent] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to add student' });
  }
};

// ── Delete student ──
export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.student.delete({ where: { id: req.params.studentId } });
    res.json({ success: true, message: 'Student removed' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Student not found' });
      return;
    }
    logger.error(`[deleteStudent] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to delete student' });
  }
};

// ── Bulk import students ──
export const bulkAddStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      res.status(400).json({ success: false, error: 'students array is required' });
      return;
    }
    const created = await prisma.student.createMany({
      data: students.map((s: any) => ({
        groupId: req.params.id,
        name: s.name,
        rollNo: s.rollNo || `R-${Date.now()}`,
        email: s.email || `${s.name?.toLowerCase().replace(/\s+/g, '.')}@school.edu`,
      })),
      skipDuplicates: true,
    });
    res.status(201).json({ success: true, data: { count: created.count }, message: `${created.count} students added` });
  } catch (error) {
    logger.error(`[bulkAddStudents] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to bulk add students' });
  }
};

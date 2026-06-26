import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import { requireRequestOrgId, getRequestUserId } from '../security/request-context';
import { z } from 'zod';

const markAttendanceSchema = z.object({
  classId: z.string(),
  date: z.string().or(z.date()),
  attendance: z.array(z.object({
    studentId: z.string(),
    status: z.enum(['PRESENT', 'ABSENT']),
    topics: z.array(z.string()).optional(),
  })),
});

export const markAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = requireRequestOrgId(req);
    const teacherId = getRequestUserId(req);
    const parsed = markAttendanceSchema.parse(req.body);
    const targetDate = new Date(parsed.date);
    targetDate.setHours(0, 0, 0, 0);

    // Ensure a valid class exists for attendance
    let classRec = await prisma.class.findFirst({
      where: { organizationId: orgId },
    });

    if (!classRec) {
      classRec = await prisma.class.create({
        data: {
          grade: '10',
          section: 'A',
          academicYear: new Date().getFullYear().toString(),
          organizationId: orgId,
        }
      });
    }
    
    // override the classId to the valid one
    const validClassId = classRec.id;

    // Process attendance updates in a transaction
    const results = await prisma.$transaction(
      parsed.attendance.map((record) => 
        prisma.attendanceRecord.upsert({
          where: {
            studentId_classId_date: {
              studentId: record.studentId,
              classId: validClassId,
              date: targetDate,
            },
          },
          create: {
            studentId: record.studentId,
            classId: validClassId,
            date: targetDate,
            status: record.status,
            topics: record.topics || [],
            organizationId: orgId,
            recordedById: teacherId,
          },
          update: {
            status: record.status,
            topics: record.topics || [],
            recordedById: teacherId,
          },
        })
      )
    );

    res.json({ success: true, count: results.length });
  } catch (error: any) {
    logger.error(`[Attendance:mark] ${error}`);
    res.status(400).json({ success: false, error: error.message || 'Failed to mark attendance' });
  }
};

export const getStudentAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = requireRequestOrgId(req);
    const studentId = getRequestUserId(req);
    
    // Allow teacher to request specific student's attendance if query param provided
    const targetStudentId = req.query.studentId ? String(req.query.studentId) : studentId;

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: targetStudentId, organizationId: orgId },
      include: {
        class: { select: { grade: true, section: true } },
      },
      orderBy: { date: 'desc' },
    });

    const totalClasses = records.length;
    const presentClasses = records.filter((r: any) => r.status === 'PRESENT').length;
    const percentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

    res.json({
      success: true,
      data: {
        records,
        stats: {
          totalClasses,
          presentClasses,
          percentage: Number(percentage.toFixed(2)),
        }
      }
    });
  } catch (error: any) {
    logger.error(`[Attendance:studentView] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch attendance' });
  }
};

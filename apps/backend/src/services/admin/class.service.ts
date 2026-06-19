import prisma from '../../config/prisma';

export class ClassService {
  static async createClass(data: {
    grade: string;
    section: string;
    academicYear: string;
    institutionId: string;
    facultyId?: string;
  }) {
    return prisma.class.create({
      data: {
        grade: data.grade,
        section: data.section,
        academicYear: data.academicYear,
        institutionId: data.institutionId,
        facultyId: data.facultyId || null,
      },
      include: {
        faculty: { select: { firstName: true, lastName: true } },
      },
    });
  }

  static async getClasses(institutionId?: string) {
    return prisma.class.findMany({
      where: institutionId ? { institutionId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        faculty: { select: { firstName: true, lastName: true } },
        _count: { select: { students: true } },
      },
    });
  }

  static async getClassById(id: string) {
    return prisma.class.findUnique({
      where: { id },
      include: {
        faculty: { select: { id: true, firstName: true, lastName: true } },
        students: true,
      },
    });
  }

  static async updateClass(
    id: string,
    data: {
      grade?: string;
      section?: string;
      academicYear?: string;
      facultyId?: string;
    }
  ) {
    return prisma.class.update({
      where: { id },
      data,
    });
  }

  static async assignStudents(classId: string, studentsList: Array<{ name: string; rollNo: string; email: string }>) {
    // Clear previous roster
    await prisma.classStudent.deleteMany({ where: { classId } });

    // Add new roster
    return prisma.classStudent.createMany({
      data: studentsList.map(s => ({
        classId,
        name: s.name,
        rollNo: s.rollNo,
        email: s.email,
      })),
    });
  }

  static async getClassAnalytics(classId: string) {
    const classDetails = await prisma.class.findUnique({ where: { id: classId } });
    if (!classDetails) throw new Error('Class not found');

    // Mocks for analytical details
    const attendancePct = 92.4;
    const assignmentCompletionPct = 87.5;
    const averageScore = 78.6;

    return {
      classId,
      grade: classDetails.grade,
      section: classDetails.section,
      attendancePct,
      assignmentCompletionPct,
      averageScore,
    };
  }
}

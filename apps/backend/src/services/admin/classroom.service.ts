import prisma from '../../config/prisma';

export class ClassroomService {
  static async createClassroom(data: { name: string; institutionId: string }) {
    return prisma.classroom.create({
      data: {
        name: data.name,
        institutionId: data.institutionId,
      },
      include: {
        _count: { select: { sections: true } }
      }
    });
  }

  static async getClassrooms(institutionId?: string) {
    return prisma.classroom.findMany({
      where: institutionId ? { institutionId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        sections: {
          include: {
            teacher: { select: { firstName: true, lastName: true } },
            _count: { select: { enrollments: true } }
          }
        },
        _count: { select: { sections: true } },
      },
    });
  }

  static async getClassroomById(id: string) {
    return prisma.classroom.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true } },
            enrollments: {
              include: {
                student: { select: { id: true, firstName: true, lastName: true, email: true } }
              }
            }
          }
        }
      },
    });
  }

  static async updateClassroom(id: string, data: { name?: string }) {
    return prisma.classroom.update({
      where: { id },
      data,
    });
  }

  static async deleteClassroom(id: string) {
    return prisma.classroom.delete({
      where: { id },
    });
  }

  static async createSection(data: { name: string; classroomId: string; teacherId: string }) {
    return prisma.section.create({
      data: {
        name: data.name,
        classroomId: data.classroomId,
        teacherId: data.teacherId,
      }
    });
  }

  static async enrollStudents(sectionId: string, studentIds: string[]) {
    // Clear previous roster or just add new? Usually you want to add new enrollments.
    // We'll insert ignoring duplicates using createMany skipDuplicates if needed, or clear.
    await prisma.enrollment.deleteMany({ where: { sectionId } });

    return prisma.enrollment.createMany({
      data: studentIds.map(studentId => ({
        sectionId,
        studentId,
      })),
      skipDuplicates: true,
    });
  }
}

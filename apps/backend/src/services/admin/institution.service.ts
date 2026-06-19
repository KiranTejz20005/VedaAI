import prisma from '../../config/prisma';

export class InstitutionService {
  static async createInstitution(data: {
    name: string;
    code: string;
    email?: string;
    phone?: string;
    address?: string;
  }) {
    return prisma.institution.create({
      data: {
        name: data.name,
        code: data.code,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        status: 'ACTIVE',
      },
    });
  }

  static async getInstitutions() {
    return prisma.institution.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
          },
        },
      },
    });
  }

  static async getInstitutionById(id: string) {
    return prisma.institution.findUnique({
      where: { id },
      include: {
        departments: true,
      },
    });
  }

  static async updateInstitution(
    id: string,
    data: {
      name?: string;
      code?: string;
      email?: string;
      address?: string;
      phone?: string;
      status?: import('@prisma/client').InstitutionStatus;
    }
  ) {
    return prisma.institution.update({
      where: { id },
      data,
    });
  }

  static async deleteInstitution(id: string) {
    return prisma.institution.delete({
      where: { id },
    });
  }

  static async suspendInstitution(id: string, suspend: boolean = true) {
    return prisma.institution.update({
      where: { id },
      data: {
        status: suspend ? 'SUSPENDED' : 'ACTIVE',
      },
    });
  }

  static async getInstitutionAnalytics(institutionId: string) {
    const totalUsers = await prisma.user.count({ where: { institutionId } });
    const facultyCount = await prisma.user.count({
      where: {
        institutionId,
        role: 'TEACHER',
      },
    });
    const studentCount = await prisma.student.count({
      where: {
        group: {
          userId: {
            in: (
              await prisma.user.findMany({
                where: { institutionId },
                select: { id: true },
              })
            ).map((u) => u.id),
          },
        },
      },
    });

    const papersGenerated = await prisma.generatedPaper.count({
      where: {
        assignment: {
          status: 'COMPLETED',
        },
      },
    });

    // Mock AI Usage for local demo
    const totalTokensUsed = 1250000;
    const estimatedCost = 3.75;

    return {
      totalUsers,
      facultyCount,
      studentCount,
      papersGenerated,
      aiUsage: {
        tokensUsed: totalTokensUsed,
        estimatedCost,
      },
    };
  }
}

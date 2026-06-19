import prisma from '../../config/prisma';

export class OrganizationService {
  static async createOrganization(data: {
    name: string;
    code: string;
    email?: string;
    phone?: string;
    address?: string;
  }) {
    return prisma.organization.create({
      data: {
        name: data.name,
        code: data.code,
        slug: data.name.toLowerCase().replace(/\s+/g, '-'),
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        status: 'ACTIVE',
      },
    });
  }

  static async getOrganizations() {
    return prisma.organization.findMany({
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

  static async getOrganizationById(id: string) {
    return prisma.organization.findUnique({
      where: { id },
      include: {
        departments: true,
      },
    });
  }

  static async updateOrganization(
    id: string,
    data: {
      name?: string;
      code?: string;
      email?: string;
      address?: string;
      phone?: string;
      status?: import('@prisma/client').OrganizationStatus;
    }
  ) {
    return prisma.organization.update({
      where: { id },
      data,
    });
  }

  static async deleteOrganization(id: string) {
    return prisma.organization.delete({
      where: { id },
    });
  }

  static async suspendOrganization(id: string, suspend: boolean = true) {
    return prisma.organization.update({
      where: { id },
      data: {
        status: suspend ? 'SUSPENDED' : 'ACTIVE',
      },
    });
  }

  static async getOrganizationAnalytics(organizationId: string) {
    const totalUsers = await prisma.user.count({ where: { organizationId } });
    const facultyCount = await prisma.user.count({
      where: {
        organizationId,
        role: 'TEACHER',
      },
    });
    const studentCount = await prisma.student.count({
      where: {
        group: {
          userId: {
            in: (
              await prisma.user.findMany({
                where: { organizationId },
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

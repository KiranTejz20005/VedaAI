import prisma from '../../config/prisma';

import { hashPassword } from '../auth.service';

export class OrganizationService {
  static async createOrganization(data: {
    name: string;
    code: string;
    email?: string;
    phone?: string;
    address?: string;
    adminEmail?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
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

      if (data.adminEmail) {
        const defaultPasswordHash = await hashPassword('Admin@123');
        await tx.user.create({
          data: {
            email: data.adminEmail,
            passwordHash: defaultPasswordHash,
            firstName: 'Admin',
            lastName: org.name,
            role: 'ADMIN',
            organizationId: org.id,
            status: 'ACTIVE',
            forcePasswordReset: true,
            hasCompletedOnboarding: false,
          },
        });
      }

      return org;
    });
  }

  static async getOrganizations() {
    return prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          where: { role: 'ADMIN' },
          select: { email: true },
          take: 1,
        },
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
      adminEmail?: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.update({
        where: { id },
        data: {
          name: data.name,
          code: data.code,
          email: data.email,
          address: data.address,
          phone: data.phone,
          status: data.status,
        },
      });

      if (data.adminEmail) {
        const existingAdmin = await tx.user.findFirst({
          where: { organizationId: id, role: 'ADMIN' },
        });

        if (existingAdmin) {
          await tx.user.update({
            where: { id: existingAdmin.id },
            data: { email: data.adminEmail },
          });
        } else {
          const defaultPasswordHash = await hashPassword('Admin@123');
          await tx.user.create({
            data: {
              email: data.adminEmail,
              passwordHash: defaultPasswordHash,
              firstName: 'Admin',
              lastName: org.name,
              role: 'ADMIN',
              organizationId: org.id,
              status: 'ACTIVE',
              forcePasswordReset: true,
              hasCompletedOnboarding: false,
            },
          });
        }
      }

      return org;
    });
  }

  static async deleteOrganization(id: string) {
    return prisma.$transaction(async (tx) => {
      // Delete associated users to prevent foreign key constraint errors
      await tx.user.deleteMany({ where: { organizationId: id } });
      return tx.organization.delete({
        where: { id },
      });
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

import prisma from '../../config/prisma';

export class AuditService {
  static async logAction(data: {
    userId?: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    return prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        ipAddress: data.ipAddress || '127.0.0.1',
        userAgent: data.userAgent || 'unknown',
        metadata: data.metadata || {},
      },
    });
  }

  static async getLogs(filters?: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    skip?: number;
  }) {
    const limit = filters?.limit || 50;
    const skip = filters?.skip || 0;

    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }
}

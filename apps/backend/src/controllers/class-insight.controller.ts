import { Request, Response } from 'express';
import { ClassInsightService } from '../services/class-insight.service';
import { sendSuccess, sendError } from '../utils/api-response.util';
import prisma from '../config/prisma';

/**
 * POST /v1/insights/class
 * Generates proactive class performance insights.
 */
export const generateProactiveInsights = async (req: Request, res: Response): Promise<void> => {
  const { subject } = req.body;
  const userId = req.user?.id ?? 'demo-faculty-id';
  const organizationId = req.user?.activeOrganizationId ?? req.user?.organizationId ?? '';

  if (!subject) {
    sendError(res, 400, 'subject is required', { errorCode: 'VALIDATION_ERROR' });
    return;
  }

  const report = await ClassInsightService.generateProactiveInsights(organizationId, userId, subject);

  if (!report) {
    sendError(res, 404, 'No quiz data found for this subject', { errorCode: 'NO_DATA' });
    return;
  }

  sendSuccess(res, report, { message: 'Class insights generated' }, 201);
};

/**
 * GET /v1/insights/reports
 * Lists all academic reports for the authenticated user's organisation.
 */
export const listReports = async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.user?.activeOrganizationId ?? req.user?.organizationId ?? '';

  const reports = await prisma.academicReport.findMany({
    where: { organizationId: organizationId || undefined },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  sendSuccess(res, reports, { message: 'Reports retrieved' });
};

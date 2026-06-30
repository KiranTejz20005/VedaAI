import { Request, Response } from 'express';
import { TeacherCopilotService } from '../services/teacher-copilot.service';
import { sendSuccess, sendError } from '../utils/api-response.util';
import prisma from '../config/prisma';

/**
 * POST /v1/copilot/lesson-plan
 * Generates a RAG-grounded lesson plan.
 */
export const generateLessonPlan = async (req: Request, res: Response): Promise<void> => {
  const { subject, topic, duration, learningOutcomes } = req.body;
  const userId = req.user?.id ?? 'demo-faculty-id';
  const organizationId = req.user?.activeOrganizationId ?? req.user?.organizationId ?? '';

  if (!subject || !topic || !duration) {
    sendError(res, 400, 'subject, topic, and duration are required', { errorCode: 'VALIDATION_ERROR' });
    return;
  }

  const plan = await TeacherCopilotService.generateLessonPlan(
    userId,
    organizationId,
    subject,
    topic,
    duration,
    Array.isArray(learningOutcomes) ? learningOutcomes : []
  );

  sendSuccess(res, plan, { message: 'Lesson plan generated' }, 201);
};

/**
 * POST /v1/copilot/workflow
 * Initiates a multi-step automation workflow.
 */
export const executeWorkflow = async (req: Request, res: Response): Promise<void> => {
  const { workflowName, tasks } = req.body;
  const userId = req.user?.id ?? 'demo-faculty-id';
  const organizationId = req.user?.activeOrganizationId ?? req.user?.organizationId ?? '';

  if (!workflowName || !Array.isArray(tasks) || tasks.length === 0) {
    sendError(res, 400, 'workflowName and tasks[] are required', { errorCode: 'VALIDATION_ERROR' });
    return;
  }

  const workflow = await TeacherCopilotService.executeWorkflow(
    userId,
    organizationId,
    workflowName,
    tasks
  );

  sendSuccess(res, workflow, { message: 'Workflow queued' }, 201);
};

/**
 * GET /v1/copilot/workflows
 * Lists automation workflows for the authenticated user.
 */
export const listWorkflows = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id ?? '';
  const organizationId = req.user?.activeOrganizationId ?? req.user?.organizationId ?? '';

  const workflows = await prisma.copilotWorkflow.findMany({
    where: { userId, organizationId: organizationId || undefined },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  sendSuccess(res, workflows, { message: 'Workflows retrieved' });
};

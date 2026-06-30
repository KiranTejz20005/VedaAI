import { Request, Response } from 'express';
import { sendSuccess, sendCreated, sendNoContent, sendNotFound } from '../common/response';
import { getRequestUserId, getRequestOrgId } from '../../security/request-context';
import { AITutorService } from '../../services/ai-tutor.service';
import prisma from '../../config/prisma';
import {
  serializeSession,
  serializeSessionDetail,
  serializeChatResponse,
  serializeConfig,
} from './serializers';

export const createSession = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const orgId = getRequestOrgId(req);
  const { subject, tutorMode } = req.body;

  const session = await prisma.tutorSession.create({
    data: {
      studentId: userId,
      subject,
      tutorMode: tutorMode || 'SOCRATIC',
      organizationId: orgId,
      status: 'ACTIVE',
    },
  });

  sendCreated(res, serializeSession(session), 'Tutor session created');
};

export const listSessions = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);

  const sessions = await prisma.tutorSession.findMany({
    where: { studentId: userId },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, { data: sessions.map(serializeSession) });
};

export const getSession = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  const session = await prisma.tutorSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  if (!session) {
    sendNotFound(res, 'Tutor session not found');
    return;
  }

  sendSuccess(res, { data: serializeSessionDetail(session) });
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;
  const userId = getRequestUserId(req);
  const orgId = getRequestOrgId(req);
  const { message } = req.body;

  const result = await AITutorService.chat(sessionId, userId, orgId!, message);

  sendSuccess(res, { data: serializeChatResponse(result) });
};

export const closeSession = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  await prisma.tutorSession.update({
    where: { id: sessionId },
    data: { status: 'CLOSED' },
  });

  sendNoContent(res);
};

export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  await prisma.tutorMessage.deleteMany({ where: { sessionId } });
  await prisma.tutorSession.delete({ where: { id: sessionId } });

  sendNoContent(res);
};

export const getConfig = async (req: Request, res: Response): Promise<void> => {
  const orgId = getRequestOrgId(req);

  const config = orgId
    ? await prisma.teacherTutorConfig.findUnique({ where: { organizationId: orgId } })
    : null;

  sendSuccess(res, { data: serializeConfig(config) });
};

export const updateConfig = async (req: Request, res: Response): Promise<void> => {
  const orgId = getRequestOrgId(req);
  const { allowDirectAnswers, maxExplanationDepth } = req.body;

  const config = await prisma.teacherTutorConfig.upsert({
    where: { organizationId: orgId! },
    update: { allowDirectAnswers, maxExplanationDepth },
    create: {
      organizationId: orgId!,
      allowDirectAnswers: allowDirectAnswers ?? false,
      maxExplanationDepth: maxExplanationDepth ?? 3,
    },
  });

  sendSuccess(res, { data: serializeConfig(config), message: 'Tutor configuration updated' });
};

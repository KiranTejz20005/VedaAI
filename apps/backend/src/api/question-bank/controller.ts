import { Request, Response } from 'express';
import { sendSuccess, sendCreated, sendNoContent } from '../common/response';
import { ApiError } from '../common/errors';
import { parsePagination, buildPagination } from '../common/pagination';
import { getRequestUserId, requireRequestOrgId } from '../../security/request-context';
import {
  searchQuestionBank,
  saveToQuestionBank,
  updateQuestionBankQuestion,
} from '../../services/question-bank.service';
import prisma from '../../config/prisma';
import {
  serializeQuestion,
  serializeQuestionVersion,
  serializeQuestionBankStats,
  serializeBulkImportResult,
} from './serializers';
import type { SearchFilters } from '../../services/question-bank.service';

export const listQuestions = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, sort, order, search } = parsePagination(req);
  const orgId = requireRequestOrgId(req);

  const { subject, difficulty, bloomLevel, status } = req.query as Record<string, string | undefined>;

  if (search || subject || difficulty || bloomLevel) {
    const filters: SearchFilters = {};
    if (subject) filters.subject = subject;
    if (difficulty) filters.difficulty = difficulty;
    if (bloomLevel) filters.bloomLevel = bloomLevel;

    const results = await searchQuestionBank(search, filters);
    const total = results.length;

    sendSuccess(res, {
      data: results.slice((page - 1) * limit, page * limit).map(serializeQuestion),
      pagination: buildPagination(page, limit, total),
    });
    return;
  }

  const where: any = { organizationId: orgId, isActive: true };
  if (status) where.status = status;

  const [questions, total] = await Promise.all([
    prisma.questionBank.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.questionBank.count({ where }),
  ]);

  sendSuccess(res, {
    data: questions.map(serializeQuestion),
    pagination: buildPagination(page, limit, total),
  });
};

export const createQuestion = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const orgId = requireRequestOrgId(req);

  const { content, options, answer, hint, subject, topic, difficulty, bloomLevel, tags } = req.body;

  const question = await saveToQuestionBank({
    content,
    options: options ?? undefined,
    answer: answer ?? undefined,
    hint: hint ?? undefined,
    subject,
    topic,
    organizationId: orgId,
    difficulty,
    bloomLevel,
    tags: tags ?? undefined,
  });

  await (prisma as any).questionBank.update({
    where: { id: question.id },
    data: { createdById: userId },
  });

  sendCreated(res, serializeQuestion(question));
};

export const getQuestion = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const orgId = requireRequestOrgId(req);

  const question = await prisma.questionBank.findFirst({
    where: { id, organizationId: orgId },
  });

  if (!question) {
    throw ApiError.notFound('Question not found');
  }

  sendSuccess(res, { data: serializeQuestion(question) });
};

export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = getRequestUserId(req);
  const orgId = requireRequestOrgId(req);

  const existing = await prisma.questionBank.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw ApiError.notFound('Question not found');

  const updated = await updateQuestionBankQuestion({
    id,
    content: req.body.content ?? existing.content,
    options: req.body.options ?? existing.options,
    answer: req.body.answer ?? existing.answer,
    userId,
  });

  if (req.body.subject || req.body.topic || req.body.difficulty || req.body.bloomLevel || req.body.tags) {
    const final = await (prisma as any).questionBank.update({
      where: { id },
      data: {
        subject: req.body.subject ?? existing.subject,
        topic: req.body.topic ?? existing.topic,
        difficulty: req.body.difficulty ?? existing.difficulty,
        bloomLevel: req.body.bloomLevel ?? existing.bloomLevel,
        tags: req.body.tags ?? existing.tags,
      },
    });
    sendSuccess(res, { data: serializeQuestion(final) });
    return;
  }

  sendSuccess(res, { data: serializeQuestion(updated) });
};

export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const orgId = requireRequestOrgId(req);

  const existing = await prisma.questionBank.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw ApiError.notFound('Question not found');

  await prisma.questionBank.update({
    where: { id },
    data: { isActive: false },
  });

  sendNoContent(res);
};

export const approveQuestion = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = getRequestUserId(req);

  const question = await prisma.questionBank.findUnique({ where: { id } });
  if (!question) throw ApiError.notFound('Question not found');

  const updated = await (prisma as any).questionBank.update({
    where: { id },
    data: { status: 'APPROVED', approvedById: userId, approvedAt: new Date() },
  });

  sendSuccess(res, { data: serializeQuestion(updated) });
};

export const rejectQuestion = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const question = await prisma.questionBank.findUnique({ where: { id } });
  if (!question) throw ApiError.notFound('Question not found');

  const updated = await (prisma as any).questionBank.update({
    where: { id },
    data: { status: 'REJECTED' },
  });

  sendSuccess(res, { data: serializeQuestion(updated) });
};

export const listQuestionVersions = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const question = await prisma.questionBank.findUnique({ where: { id } });
  if (!question) throw ApiError.notFound('Question not found');

  const versions = await prisma.questionVersion.findMany({
    where: { questionId: id },
    orderBy: { versionNumber: 'desc' },
  });

  sendSuccess(res, { data: versions.map(serializeQuestionVersion) });
};

export const bulkImportQuestions = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);

  const { questions } = req.body;
  let imported = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < questions.length; i++) {
    try {
      const q = questions[i];
      await saveToQuestionBank({
        content: q.content,
        options: q.options ?? undefined,
        answer: q.answer ?? undefined,
        hint: q.hint ?? undefined,
        subject: q.subject,
        topic: q.topic,
        organizationId: orgId,
        difficulty: q.difficulty,
        bloomLevel: q.bloomLevel,
        tags: q.tags ?? undefined,
      });
      imported++;
    } catch (err: any) {
      failed++;
      errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }

  sendCreated(res, serializeBulkImportResult({ imported, failed, errors: errors.length > 0 ? errors : undefined }));
};

export const getQuestionBankStats = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);

  const [totalQuestions, byStatus, byDifficulty, byBloomLevel, bySubject] = await Promise.all([
    prisma.questionBank.count({ where: { organizationId: orgId, isActive: true } }),
    (prisma as any).questionBank.groupBy({
      by: ['status'],
      where: { organizationId: orgId, isActive: true },
      _count: true,
    }),
    prisma.questionBank.groupBy({
      by: ['difficulty'],
      where: { organizationId: orgId, isActive: true },
      _count: true,
    }),
    prisma.questionBank.groupBy({
      by: ['bloomLevel'],
      where: { organizationId: orgId, isActive: true },
      _count: true,
    }),
    prisma.questionBank.groupBy({
      by: ['subject'],
      where: { organizationId: orgId, isActive: true },
      _count: true,
    }),
  ]);

  const statusMap: Record<string, number> = {};
  byStatus.forEach((s: any) => { statusMap[s.status] = s._count; });

  const diffMap: Record<string, number> = {};
  byDifficulty.forEach((d) => { diffMap[d.difficulty] = d._count; });

  const bloomMap: Record<string, number> = {};
  byBloomLevel.forEach((b) => { bloomMap[b.bloomLevel] = b._count; });

  const subjectMap: Record<string, number> = {};
  bySubject.forEach((s) => { subjectMap[s.subject] = s._count; });

  sendSuccess(res, {
    data: serializeQuestionBankStats({
      totalQuestions,
      approved: statusMap['APPROVED'] ?? 0,
      pending: statusMap['PENDING'] ?? 0,
      rejected: statusMap['REJECTED'] ?? 0,
      byDifficulty: diffMap,
      byBloomLevel: bloomMap,
      bySubject: subjectMap,
    }),
  });
};

import type { QuestionDto, QuestionVersionDto, QuestionBankStatsDto, BulkImportResultDto } from './dto';

export function serializeQuestion(question: any): QuestionDto {
  return {
    id: question.id,
    content: question.content,
    options: question.options ?? undefined,
    answer: question.answer ?? undefined,
    hint: question.hint ?? undefined,
    subject: question.subject,
    topic: question.topic,
    organizationId: question.organizationId,
    difficulty: question.difficulty,
    bloomLevel: question.bloomLevel,
    tags: question.tags ?? [],
    status: question.status ?? 'PENDING',
    isActive: question.isActive ?? true,
    createdById: question.createdById ?? undefined,
    createdAt: question.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: question.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export function serializeQuestionVersion(version: any): QuestionVersionDto {
  return {
    id: version.id,
    questionId: version.questionId,
    versionNumber: version.versionNumber,
    content: version.content,
    options: version.options ?? undefined,
    answer: version.answer ?? undefined,
    updatedBy: version.updatedBy,
    createdAt: version.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export function serializeQuestionBankStats(stats: any): QuestionBankStatsDto {
  return {
    totalQuestions: stats.totalQuestions ?? 0,
    approved: stats.approved ?? 0,
    pending: stats.pending ?? 0,
    rejected: stats.rejected ?? 0,
    byDifficulty: stats.byDifficulty ?? {},
    byBloomLevel: stats.byBloomLevel ?? {},
    bySubject: stats.bySubject ?? {},
  };
}

export function serializeBulkImportResult(result: BulkImportResultDto): BulkImportResultDto {
  return result;
}

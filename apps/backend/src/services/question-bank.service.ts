import prisma from '../config/prisma';
import { logger } from '../utils/logger';

export interface SearchFilters {
  subject?: string;
  topic?: string;
  difficulty?: string;
  bloomLevel?: string;
  tags?: string[];
}

/**
 * Save a question to the central Question Bank
 */
export async function saveToQuestionBank(params: {
  content: string;
  options?: any;
  answer?: string;
  hint?: string;
  subject: string;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  bloomLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  tags?: string[];
}) {
  try {
    const question = await prisma.questionBank.create({
      data: {
        content: params.content,
        options: params.options || null,
        answer: params.answer || null,
        hint: params.hint || null,
        subject: params.subject,
        topic: params.topic,
        difficulty: params.difficulty,
        bloomLevel: params.bloomLevel,
        tags: params.tags || [],
      },
    });

    // Seed version 1
    await prisma.questionVersion.create({
      data: {
        questionId: question.id,
        versionNumber: 1,
        content: question.content,
        options: question.options as any,
        answer: question.answer,
        updatedBy: 'system',
      },
    });

    return question;
  } catch (err) {
    logger.error(`[saveToQuestionBank] Failed: ${err}`);
    throw err;
  }
}

/**
 * Search the Question Bank with full-text search and filters
 */
export async function searchQuestionBank(query: string, filters: SearchFilters) {
  const whereClause: any = {
    isActive: true,
  };

  if (query) {
    whereClause.content = {
      contains: query,
      mode: 'insensitive',
    };
  }

  if (filters.subject) {
    whereClause.subject = { equals: filters.subject, mode: 'insensitive' };
  }

  if (filters.topic) {
    whereClause.topic = { equals: filters.topic, mode: 'insensitive' };
  }

  if (filters.difficulty) {
    whereClause.difficulty = filters.difficulty as any;
  }

  if (filters.bloomLevel) {
    whereClause.bloomLevel = filters.bloomLevel as any;
  }

  if (filters.tags && filters.tags.length > 0) {
    whereClause.tags = {
      hasSome: filters.tags,
    };
  }

  return prisma.questionBank.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Update an existing question and increment version details
 */
export async function updateQuestionBankQuestion(params: {
  id: string;
  content: string;
  options?: any;
  answer?: string;
  userId: string;
}) {
  const question = await prisma.questionBank.findUnique({
    where: { id: params.id },
    include: { versions: { orderBy: { versionNumber: 'desc' } } },
  });

  if (!question) {
    throw new Error('Question not found in bank');
  }

  const nextVersionNum = (question.versions[0]?.versionNumber ?? 0) + 1;

  const updated = await prisma.questionBank.update({
    where: { id: params.id },
    data: {
      content: params.content,
      options: params.options || null,
      answer: params.answer || null,
    },
  });

  await prisma.questionVersion.create({
    data: {
      questionId: params.id,
      versionNumber: nextVersionNum,
      content: params.content,
      options: params.options as any,
      answer: params.answer,
      updatedBy: params.userId,
    },
  });

  return updated;
}

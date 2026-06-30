import { z } from 'zod';

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listQuestionsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    sort: z.string().optional().default('createdAt'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
    search: z.string().optional().default(''),
    subject: z.string().optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    bloomLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']).optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  }),
});

export const createQuestionSchema = z.object({
  body: z.object({
    content: z.string().min(1),
    options: z.any().optional(),
    answer: z.string().optional(),
    hint: z.string().optional(),
    subject: z.string().min(1),
    topic: z.string().min(1),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    bloomLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']),
    tags: z.array(z.string()).optional(),
  }),
});

export const updateQuestionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    content: z.string().min(1).optional(),
    options: z.any().optional(),
    answer: z.string().optional(),
    hint: z.string().optional(),
    subject: z.string().optional(),
    topic: z.string().optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    bloomLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const bulkImportSchema = z.object({
  body: z.object({
    questions: z.array(z.object({
      content: z.string().min(1),
      options: z.any().optional(),
      answer: z.string().optional(),
      hint: z.string().optional(),
      subject: z.string().min(1),
      topic: z.string().min(1),
      difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
      bloomLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']),
      tags: z.array(z.string()).optional(),
    })).min(1),
  }),
});

import { z } from 'zod';

const answerSchema = z.object({
  text: z.string().min(1),
  explanation: z.string().optional(),
});

const mcqOptionSchema = z.object({
  key: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1),
});

const questionSchema = z.object({
  id: z.string().uuid(),
  question: z.string().min(5),
  type: z.enum(['short-answer', 'long-answer', 'mcq', 'true-false', 'fill-blank']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  marks: z.number().int().min(1),
  options: z.array(mcqOptionSchema).optional(),
  blanks: z.number().int().min(0).optional(),
  answer: answerSchema.optional(),
});

const sectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().default(''),
  questions: z.array(questionSchema).min(1),
});

export const generatedPaperSchema = z.object({
  title: z.string().min(1),
  totalMarks: z.number().int().min(1),
  sections: z.array(sectionSchema).min(1),
});

export type ValidatedPaper = z.infer<typeof generatedPaperSchema>;

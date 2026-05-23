import { z } from 'zod';

const answerSchema = z.object({
  text: z.string().min(1),
  explanation: z.string().optional(),
}).strict();

const mcqOptionSchema = z.object({
  key: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1),
}).strict();

const baseQuestionSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID v1-5' }),
  question: z.string().min(5),
  type: z.enum(['short-answer', 'long-answer', 'mcq', 'true-false', 'fill-blank']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  marks: z.number().int().min(1),
  answer: answerSchema.optional(),
}).strict();

const mcqQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('mcq'),
  options: z.array(mcqOptionSchema).length(4),
}).strict();

const trueFalseQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('true-false'),
}).strict();

const fillBlankQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('fill-blank'),
  blanks: z.number().int().min(1),
}).strict();

const shortAnswerQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('short-answer'),
}).strict();

const longAnswerQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('long-answer'),
}).strict();

export const questionSchema = z.discriminatedUnion('type', [
  mcqQuestionSchema,
  trueFalseQuestionSchema,
  fillBlankQuestionSchema,
  shortAnswerQuestionSchema,
  longAnswerQuestionSchema,
]);

const sectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().default(''),
  questions: z.array(questionSchema).min(1),
}).strict();

export const generatedPaperSchema = z.object({
  title: z.string().min(1),
  totalMarks: z.number().int().min(1),
  sections: z.array(sectionSchema).min(1),
}).strict();

export type ValidatedPaper = z.infer<typeof generatedPaperSchema>;

export function validatePaperOrThrow(paper: unknown): ValidatedPaper {
  const result = generatedPaperSchema.safeParse(paper);
  if (!result.success) {
    throw new Error(`Invalid paper schema: ${result.error.message}`);
  }
  return result.data;
}

import { z } from 'zod';
import type { QuestionType } from '../../types/assignment.types';
import { isolateAndRepair } from '../../parsers/question-isolator';
import { validateSingleQuestion } from '../../validators/per-question-validator';

const mcqOptionSchema = z.object({
  key: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1),
});

const batchQuestionSchema = z.object({
  id: z.string().uuid(),
  question: z.string().min(5),
  type: z.enum(['short-answer', 'long-answer', 'mcq', 'true-false', 'fill-blank']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  marks: z.number().int().min(1),
  options: z.array(mcqOptionSchema).optional(),
  blanks: z.number().int().min(0).optional(),
  answer: z
    .object({
      text: z.string().min(1),
      explanation: z.string().optional(),
    })
    .optional(),
});

export interface BatchQuestion {
  id: string;
  question: string;
  type: QuestionType;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options?: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }>;
  blanks?: number;
  answer?: { text: string; explanation?: string };
}

export interface BatchValidationContext {
  batchId: string;
  expectedCount: number;
  expectedMarks: number;
  allowedTypes: QuestionType[];
  expectedType?: QuestionType;
}

export interface BatchValidationResult {
  ok: boolean;
  questions: BatchQuestion[];
  generatedCount: number;
  generatedMarks: number;
  diagnostics: string[];
  repairCount: number;
  discardCount: number;
  totalDetected: number;
  malformedNodeCount: number;
  repairTypes: string[];
  salvageRate: number;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function isLikelyTruncated(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;
  if (trimmed.endsWith(',')) return true;
  if (trimmed.endsWith(':')) return true;
  if (trimmed.endsWith('{') || trimmed.endsWith('[')) return true;
  return false;
}

export function validateBatchResponse(
  rawOutput: string,
  context: BatchValidationContext
): BatchValidationResult {
  const diagnostics: string[] = [];

  if (isLikelyTruncated(rawOutput)) {
    diagnostics.push(`Batch ${context.batchId} output appears truncated`);
  }

  const isolation = isolateAndRepair(rawOutput);

  if (isolation.totalDetected === 0) {
    diagnostics.push(`Batch ${context.batchId}: no question objects found in output`);
    return {
      ok: false,
      questions: [],
      generatedCount: 0,
      generatedMarks: 0,
      diagnostics,
      repairCount: 0,
      discardCount: 0,
      totalDetected: 0,
      malformedNodeCount: isolation.malformedNodeCount,
      repairTypes: isolation.repairTypes,
      salvageRate: 0,
    };
  }

  const allowedTypes = new Set(context.allowedTypes);
  const seenQuestions = new Set<string>();
  const seenAnswers = new Set<string>();
  const validQuestions: BatchQuestion[] = [];
  let repairCount = 0;
  let discardCount = 0;

  for (let i = 0; i < isolation.questions.length; i++) {
    const isolated = isolation.questions[i];
    const question = isolated.question;

    if (context.expectedType && question.type !== context.expectedType) {
      if (!allowedTypes.has(String(question.type) as QuestionType) || context.allowedTypes.length === 1) {
        question.type = context.expectedType;
        diagnostics.push(`Question ${i + 1}: type normalized to expected "${context.expectedType}"`);
        if (context.expectedType !== 'mcq') {
          delete question.options;
        }
      }
    }

    // Per-question validation
    const validation = validateSingleQuestion(question, i);

    // If valid, try strict Zod validation
    if (validation.valid) {
      const schemaResult = batchQuestionSchema.safeParse(question);
      if (schemaResult.success) {
        // Additional semantic checks
        const q = schemaResult.data;
        let semanticIssues = false;

        if (!allowedTypes.has(q.type)) {
          diagnostics.push(`Question ${i + 1}: disallowed type "${q.type}", discarded`);
          semanticIssues = true;
        }

        const normalizedQuestion = normalizeText(q.question);
        if (normalizedQuestion.includes('lorem ipsum') || normalizedQuestion.includes('generated question')) {
          diagnostics.push(`Question ${i + 1}: placeholder text detected, discarded`);
          semanticIssues = true;
        }

        if (seenQuestions.has(normalizedQuestion)) {
          diagnostics.push(`Question ${i + 1}: duplicate question text, discarded`);
          semanticIssues = true;
        }

        if (!semanticIssues) {
          seenQuestions.add(normalizedQuestion);
          validQuestions.push(q);

          if (q.answer?.text) {
            seenAnswers.add(normalizeText(q.answer.text));
          }

          continue;
        }
      } else {
        diagnostics.push(`Question ${i + 1}: schema validation failed, discarded`);
        discardCount++;
        continue;
      }
    }

    // Question is invalid or failed semantic checks
    discardCount++;

    // If it was repaired but still invalid, add diagnostics
    if (isolated.recoveryMethod !== 'direct') {
      diagnostics.push(`Question ${i + 1}: repaired but failed validation: ${validation.errors.join('; ')}`);
    } else {
      diagnostics.push(`Question ${i + 1}: validation failed: ${validation.errors.join('; ')}`);
    }
  }

  const generatedCount = validQuestions.length;
  const generatedMarks = validQuestions.reduce((sum, q) => sum + q.marks, 0);
  discardCount += isolation.discardedCount;
  repairCount += isolation.questions.filter((q) => q.recoveryMethod !== 'direct' || q.diagnostics.length > 0).length;
  const salvageRate = isolation.totalDetected > 0 ? generatedCount / isolation.totalDetected : 0;

  if (generatedCount === 0) {
    diagnostics.push(`Batch ${context.batchId}: zero valid questions recovered`);
    return {
      ok: false,
      questions: [],
      generatedCount: 0,
      generatedMarks: 0,
      diagnostics,
      repairCount,
      discardCount,
      totalDetected: isolation.totalDetected,
      malformedNodeCount: isolation.malformedNodeCount,
      repairTypes: isolation.repairTypes,
      salvageRate,
    };
  }

  // CHECK: count mismatch. This is a soft warning (not fatal) in the new architecture.
  if (generatedCount !== context.expectedCount) {
    diagnostics.push(
      `Batch ${context.batchId} question count: recovered=${generatedCount}, expected=${context.expectedCount}`
    );
  }

  if (generatedMarks !== context.expectedMarks) {
    diagnostics.push(
      `Batch ${context.batchId} marks: recovered=${generatedMarks}, expected=${context.expectedMarks}`
    );
  }

  const ok = generatedCount > 0 && generatedCount >= Math.ceil(context.expectedCount * 0.5);

  return {
    ok,
    questions: validQuestions,
    generatedCount,
    generatedMarks,
    diagnostics,
    repairCount,
    discardCount,
    totalDetected: isolation.totalDetected,
    malformedNodeCount: isolation.malformedNodeCount,
    repairTypes: isolation.repairTypes,
    salvageRate,
  };
}

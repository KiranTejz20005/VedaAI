import type { IAssignment } from '../../models/Assignment.model';
import type { ValidatedPaper } from '../../validators/paper.validator';
import type { QuestionTypeBreakdown } from '../../prompts/generation.prompt';

export interface QualityGateResult {
  ok: boolean;
  diagnostics: string[];
  generatedQuestionCount: number;
  requestedQuestionCount: number;
  generatedMarks: number;
  requestedMarks: number;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function isLowInformationQuestion(text: string): boolean {
  const normalized = normalizeText(text);
  if (normalized.length < 8) return true;
  if (/^generated question/i.test(normalized)) return true;
  if (/^question\s*\d+$/i.test(normalized)) return true;
  return false;
}

export function evaluatePaperQuality(
  assignment: IAssignment,
  paper: ValidatedPaper,
  typeBreakdown?: QuestionTypeBreakdown[]
): QualityGateResult {
  const diagnostics: string[] = [];

  const questions = paper.sections.flatMap((s) => s.questions);
  const generatedQuestionCount = questions.length;
  const requestedQuestionCount = assignment.questionConfig.count;

  const generatedMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const requestedMarks = assignment.totalMarks;

  if (generatedQuestionCount !== requestedQuestionCount) {
    diagnostics.push(
      `Question count mismatch: generated=${generatedQuestionCount}, requested=${requestedQuestionCount}`
    );
  }

  if (generatedMarks !== requestedMarks) {
    diagnostics.push(`Marks mismatch: generated=${generatedMarks}, requested=${requestedMarks}`);
  }

  const requestedTypes = new Set(assignment.questionConfig.types);
  const typeCounts = new Map<string, number>();
  const typeMarks = new Map<string, number>();

  for (const q of questions) {
    typeCounts.set(q.type, (typeCounts.get(q.type) ?? 0) + 1);
    typeMarks.set(q.type, (typeMarks.get(q.type) ?? 0) + q.marks);
  }

  for (const type of requestedTypes) {
    if ((typeCounts.get(type) ?? 0) === 0) {
      diagnostics.push(`Configured type missing in output: ${type}`);
    }
  }

  if (typeBreakdown && typeBreakdown.length > 0) {
    for (const bucket of typeBreakdown) {
      const actualCount = typeCounts.get(bucket.type) ?? 0;
      if (actualCount !== bucket.count) {
        diagnostics.push(
          `Type count mismatch for ${bucket.type}: generated=${actualCount}, requested=${bucket.count}`
        );
      }

      if (bucket.marksPerQuestion > 0) {
        const actualMarks = typeMarks.get(bucket.type) ?? 0;
        const expectedMarks = bucket.count * bucket.marksPerQuestion;
        if (actualMarks !== expectedMarks) {
          diagnostics.push(
            `Type marks mismatch for ${bucket.type}: generated=${actualMarks}, requested=${expectedMarks}`
          );
        }
      }
    }
  }

  const seenQuestions = new Set<string>();
  const duplicateQuestions = new Set<string>();
  const seenAnswers = new Set<string>();
  const duplicateAnswers = new Set<string>();

  for (const q of questions) {
    const normalizedQuestion = normalizeText(q.question);
    if (isLowInformationQuestion(q.question)) {
      diagnostics.push(`Low-information question detected: "${q.question.slice(0, 48)}"`);
    }

    if (seenQuestions.has(normalizedQuestion)) {
      duplicateQuestions.add(normalizedQuestion);
    }
    seenQuestions.add(normalizedQuestion);

    if (q.type === 'mcq') {
      const options = q.options ?? [];
      if (options.length < 4) {
        diagnostics.push(`MCQ has fewer than 4 options for question id=${q.id}`);
      }
      const seenOptions = new Set<string>();
      for (const opt of options) {
        const txt = normalizeText(opt.text);
        if (!txt) {
          diagnostics.push(`MCQ contains empty option text for question id=${q.id}`);
          continue;
        }
        if (seenOptions.has(txt)) {
          diagnostics.push(`MCQ contains duplicate option text for question id=${q.id}`);
        }
        seenOptions.add(txt);
      }
    }

    if (q.answer?.text) {
      const normalizedAnswer = normalizeText(q.answer.text);
      if (normalizedAnswer.length < 5) {
        diagnostics.push(`Low-information answer detected for question id=${q.id}`);
      }
      if (seenAnswers.has(normalizedAnswer)) {
        duplicateAnswers.add(normalizedAnswer);
      }
      seenAnswers.add(normalizedAnswer);

      if ('explanation' in q.answer && (q.answer.explanation ?? '').trim().length === 0) {
        diagnostics.push(`Empty explanation detected for question id=${q.id}`);
      }
    }
  }

  if (duplicateQuestions.size > 0) {
    diagnostics.push(`Duplicate question text detected (${duplicateQuestions.size})`);
  }

  if (duplicateAnswers.size > 0) {
    diagnostics.push(`Duplicate answer text detected (${duplicateAnswers.size})`);
  }

  return {
    ok: diagnostics.length === 0,
    diagnostics,
    generatedQuestionCount,
    requestedQuestionCount,
    generatedMarks,
    requestedMarks,
  };
}

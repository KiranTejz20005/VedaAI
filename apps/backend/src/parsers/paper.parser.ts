import { randomUUID } from 'crypto';
import { generatedPaperSchema, type ValidatedPaper } from '../validators/paper.validator';

export interface ValidationDiagnostic {
  level: 'warning' | 'error';
  path: string;
  code: string;
  message: string;
}

export class PaperParseError extends Error {
  constructor(
    message: string,
    public readonly rawOutput: string,
    public readonly retryable: boolean = true,
    public readonly diagnostics: ValidationDiagnostic[] = []
  ) {
    super(message);
    this.name = 'PaperParseError';
  }
}

function extractJson(text: string): string {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');

  const objectCandidate =
    firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
      ? text.slice(firstBrace, lastBrace + 1)
      : '';
  const arrayCandidate =
    firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket
      ? text.slice(firstBracket, lastBracket + 1)
      : '';

  if (objectCandidate && arrayCandidate) {
    return objectCandidate.length >= arrayCandidate.length ? objectCandidate : arrayCandidate;
  }

  return objectCandidate || arrayCandidate || text;
}

function tryRepairJson(text: string): string {
  let repaired = text
    .replace(/(['"])?([a-zA-Z_][a-zA-Z0-9_]*)(['"])?:/g, '"$2":')
    .replace(/:\s*'([^']*)'/g, ':"$1"')
    .replace(/,\s*([\]}])/g, '$1')
    .replace(/undefined/g, 'null')
    .replace(/NaN/g, 'null');
  const openCurlies = (repaired.match(/{/g) || []).length;
  const closeCurlies = (repaired.match(/}/g) || []).length;
  if (openCurlies > closeCurlies) repaired += '}'.repeat(openCurlies - closeCurlies);
  if (closeCurlies > openCurlies) repaired = repaired.slice(0, repaired.lastIndexOf('}') + 1);
  return repaired;
}

function normalizeQuestionType(value: unknown): string {
  const input = String(value ?? '').trim().toLowerCase();
  const map: Record<string, string> = {
    mcq: 'mcq',
    'multiple choice': 'mcq',
    multiple_choice: 'mcq',
    'multiple-choice': 'mcq',
    'true false': 'true-false',
    truefalse: 'true-false',
    'true-false': 'true-false',
    'fill blank': 'fill-blank',
    fillblank: 'fill-blank',
    'fill-in-the-blank': 'fill-blank',
    'fill-blank': 'fill-blank',
    short: 'short-answer',
    shortanswer: 'short-answer',
    'short-answer': 'short-answer',
    long: 'long-answer',
    longanswer: 'long-answer',
    'long-answer': 'long-answer',
  };
  return map[input] ?? input;
}

function normalizeDifficulty(value: unknown): string {
  const input = String(value ?? '').trim().toLowerCase();
  const map: Record<string, string> = {
    easy: 'easy',
    beginner: 'easy',
    basic: 'easy',
    medium: 'medium',
    moderate: 'medium',
    normal: 'medium',
    hard: 'hard',
    advanced: 'hard',
    difficult: 'hard',
  };
  return map[input] ?? input;
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizePaperStructure(input: unknown): { normalized: unknown; diagnostics: ValidationDiagnostic[] } {
  const diagnostics: ValidationDiagnostic[] = [];
  if (typeof input !== 'object' || input === null) return { normalized: input, diagnostics };

  const source = input as Record<string, unknown>;
  const paperContainer =
    source.paper && typeof source.paper === 'object'
      ? (source.paper as Record<string, unknown>)
      : source.data && typeof source.data === 'object'
      ? (source.data as Record<string, unknown>)
      : source;

  const sections = Array.isArray(paperContainer.sections) ? paperContainer.sections : [];
  const normalizedSections: Array<Record<string, unknown>> = [];
  let totalMarks = 0;

  for (let s = 0; s < sections.length; s++) {
    const section = sections[s] as Record<string, unknown>;
    const sectionTitle = String(section?.title ?? '').trim() || `Section ${s + 1}`;
    const instruction = String(section?.instruction ?? '').trim();
    const questions = Array.isArray(section?.questions) ? section.questions : [];
    const normalizedQuestions: Array<Record<string, unknown>> = [];

    for (let q = 0; q < questions.length; q++) {
      const item = questions[q] as Record<string, unknown>;
      const qPath = `sections.${s}.questions.${q}`;

      const idRaw = String(item.id ?? '').trim();
      const id = isUuidLike(idRaw) ? idRaw : randomUUID();
      if (!isUuidLike(idRaw)) {
        diagnostics.push({
          level: 'warning',
          path: `${qPath}.id`,
          code: 'uuid_repaired',
          message: 'Question id was invalid and replaced with generated UUID',
        });
      }

      const questionTextRaw = String(item.question ?? '').trim();
      const questionText = questionTextRaw.length >= 5 ? questionTextRaw : `Generated question ${q + 1}`;
      if (questionTextRaw.length < 5) {
        diagnostics.push({
          level: 'warning',
          path: `${qPath}.question`,
          code: 'question_repaired',
          message: 'Question text was too short and replaced with fallback text',
        });
      }

      let type = normalizeQuestionType(item.type);
      const validTypes = new Set(['short-answer', 'long-answer', 'mcq', 'true-false', 'fill-blank']);
      if (!validTypes.has(type)) {
        type = Array.isArray(item.options) ? 'mcq' : 'short-answer';
        diagnostics.push({
          level: 'warning',
          path: `${qPath}.type`,
          code: 'type_repaired',
          message: `Question type was invalid and normalized to ${type}`,
        });
      }

      let difficulty = normalizeDifficulty(item.difficulty);
      const validDifficulty = new Set(['easy', 'medium', 'hard']);
      if (!validDifficulty.has(difficulty)) {
        difficulty = 'medium';
        diagnostics.push({
          level: 'warning',
          path: `${qPath}.difficulty`,
          code: 'difficulty_repaired',
          message: 'Difficulty was invalid and defaulted to medium',
        });
      }

      const marksRaw = Number(item.marks);
      const marks = Number.isFinite(marksRaw) && marksRaw > 0 ? Math.round(marksRaw) : 1;
      if (!Number.isFinite(marksRaw) || marksRaw <= 0) {
        diagnostics.push({
          level: 'warning',
          path: `${qPath}.marks`,
          code: 'marks_repaired',
          message: 'Marks were invalid and defaulted to 1',
        });
      }
      totalMarks += marks;

      const normalizedQuestion: Record<string, unknown> = {
        id,
        question: questionText,
        type,
        difficulty,
        marks,
      };

      if (type === 'mcq') {
        const keys = ['A', 'B', 'C', 'D'];
        const rawOptions = Array.isArray(item.options) ? item.options : [];
        const cleaned = rawOptions
          .map((opt, idx) => {
            if (typeof opt === 'string') {
              return { key: keys[idx] ?? 'A', text: opt.trim() };
            }
            if (typeof opt === 'object' && opt !== null) {
              const obj = opt as Record<string, unknown>;
              const key = String(obj.key ?? keys[idx] ?? 'A').trim().toUpperCase();
              const text = String(obj.text ?? '').trim();
              return { key, text };
            }
            return { key: keys[idx] ?? 'A', text: '' };
          })
          .filter((opt) => opt.text.length > 0);

        const deduped: Array<{ key: string; text: string }> = [];
        const seenText = new Set<string>();
        for (const opt of cleaned) {
          const marker = opt.text.toLowerCase();
          if (seenText.has(marker)) continue;
          seenText.add(marker);
          deduped.push(opt);
        }

        while (deduped.length < 4) {
          deduped.push({ key: keys[deduped.length]!, text: `Option ${keys[deduped.length]!}` });
          diagnostics.push({
            level: 'warning',
            path: `${qPath}.options`,
            code: 'options_filled',
            message: 'MCQ options were incomplete and placeholder options were added',
          });
        }

        normalizedQuestion.options = deduped.slice(0, 4).map((opt, idx) => ({ key: keys[idx]!, text: opt.text }));
      }

      if (type === 'fill-blank') {
        const blanks = Number(item.blanks);
        normalizedQuestion.blanks = Number.isFinite(blanks) && blanks > 0 ? Math.round(blanks) : 1;
      }

      if (item.answer && typeof item.answer === 'object') {
        const answerObj = item.answer as Record<string, unknown>;
        const answerText = String(answerObj.text ?? '').trim();
        if (answerText.length > 0) {
          normalizedQuestion.answer = {
            text: answerText,
            explanation: String(answerObj.explanation ?? '').trim() || undefined,
          };
        }
      }

      normalizedQuestions.push(normalizedQuestion);
    }

    if (normalizedQuestions.length > 0) {
      normalizedSections.push({
        title: sectionTitle,
        instruction,
        questions: normalizedQuestions,
      });
    }
  }

  const normalized = {
    title: String(paperContainer.title ?? '').trim() || 'Generated Paper',
    totalMarks: Number(paperContainer.totalMarks) || totalMarks || 1,
    sections: normalizedSections,
  };

  return { normalized, diagnostics };
}

export function parsePaperJson(rawOutput: string): ValidatedPaper {
  const t0 = Date.now();
  console.log(`[PARSE] Input ${rawOutput.length} chars`);
  let cleaned = rawOutput
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  cleaned = extractJson(cleaned);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    const repairAttempt = tryRepairJson(cleaned);
    try {
      parsed = JSON.parse(repairAttempt);
      console.log(`[PARSE] JSON repaired from parse failure`);
    } catch (e2) {
      console.error(`[PARSE] JSON parse FAILED after repair`);
      throw new PaperParseError('AI output is not valid JSON', rawOutput, true);
    }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new PaperParseError('AI output is not a JSON object', rawOutput, true);
  }

  const wrapped = tryEnhanceResult(parsed);
  const { normalized, diagnostics } = normalizePaperStructure(wrapped);
  const result = generatedPaperSchema.safeParse(normalized);
  if (!result.success) {
    console.error(`[PARSE] Schema validation FAILED: ${result.error.message.slice(0, 200)}`);
    const schemaDiagnostics: ValidationDiagnostic[] = result.error.errors.map((err) => ({
      level: 'error',
      path: err.path.join('.'),
      code: err.code,
      message: err.message,
    }));
    throw new PaperParseError(
      `AI output failed validation: ${result.error.message}`,
      rawOutput,
      true,
      [...diagnostics, ...schemaDiagnostics]
    );
  }
  if (diagnostics.length > 0) {
    console.log(`[PARSE] Applied ${diagnostics.length} normalization repairs before validation`);
  }
  console.log(`[PARSE] SUCCESS in ${Date.now() - t0}ms | title="${result.data.title}" sections=${result.data.sections.length}`);
  return result.data;
}

function tryEnhanceResult(parsed: unknown): unknown {
  if (typeof parsed !== 'object' || parsed === null) return parsed;
  const obj = parsed as Record<string, unknown>;

  // Common model wrappers: { paper: {...} } or { data: {...} }.
  if (obj.paper && typeof obj.paper === 'object') return tryEnhanceResult(obj.paper);
  if (obj.data && typeof obj.data === 'object') return tryEnhanceResult(obj.data);

  // Some models return sections only; synthesize required top-level fields.
  if (!obj.title && Array.isArray(obj.sections)) {
    const computedMarks = obj.sections.reduce((sum: number, sec: any) => {
      const questions = Array.isArray(sec?.questions) ? sec.questions : [];
      return sum + questions.reduce((qSum: number, q: any) => qSum + (Number(q?.marks) || 0), 0);
    }, 0);
    return {
      title: 'Generated Paper',
      totalMarks: Number(obj.totalMarks) || computedMarks || 1,
      sections: obj.sections,
    };
  }

  if (!obj.sections || !Array.isArray(obj.sections)) return obj;
  for (const section of obj.sections) {
    if (typeof section !== 'object' || section === null) continue;
    const sec = section as Record<string, unknown>;
    if (sec.instruction === undefined || sec.instruction === null) sec.instruction = '';
    if (sec.questions && Array.isArray(sec.questions)) {
      for (const q of sec.questions) {
        if (typeof q !== 'object' || q === null) continue;
        const question = q as Record<string, unknown>;
        if (question.blanks === 0) delete question.blanks;
        if (question.options && !Array.isArray(question.options)) delete question.options;
        if (Array.isArray(question.options) && question.options.length > 0) {
          const opt = question.options[0];
          if (typeof opt === 'string') {
            const keys = ['A', 'B', 'C', 'D'];
            question.options = (question.options as string[]).map((text, i) => ({
              key: keys[i] || String.fromCharCode(65 + i),
              text,
            }));
          }
        }
      }
    }
  }
  return obj;
}

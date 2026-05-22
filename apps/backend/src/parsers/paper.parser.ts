import { generatedPaperSchema, type ValidatedPaper } from '../validators/paper.validator';
import { isolateAndRepair } from './question-isolator';
import { validateSingleQuestion } from '../validators/per-question-validator';

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
    public readonly diagnostics: ValidationDiagnostic[] = [],
    public readonly partialQuestions: Record<string, unknown>[] = []
  ) {
    super(message);
    this.name = 'PaperParseError';
  }
}

export interface PaperParseResult {
  paper: ValidatedPaper;
  diagnostics: ValidationDiagnostic[];
  recoveredCount: number;
  totalDetected: number;
  discardedCount: number;
}

function sanitize(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function findOuterStructure(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) {
    const bracketStart = text.indexOf('[');
    if (bracketStart === -1) return null;
    let depth = 0;
    for (let i = bracketStart; i < text.length; i++) {
      if (text[i] === '[') depth++;
      if (text[i] === ']') { depth--; if (depth === 0) return text.slice(bracketStart, i + 1); }
    }
    return null;
  }
  let depth = 0;
  let inStr = false;
  let strChar = '';
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strChar) inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; strChar = ch; continue; }
    if (ch === '{') { depth++; continue; }
    if (ch === '}') { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;
}

function tryRepairJson(text: string): string {
  let repaired = text
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    .replace(/:\s*'([^']*)'/g, ':"$1"')
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/\bundefined\b/g, 'null')
    .replace(/\bNaN\b/g, 'null');
  const openCurlies = (repaired.match(/{/g) || []).length;
  const closeCurlies = (repaired.match(/}/g) || []).length;
  if (openCurlies > closeCurlies) repaired += '}'.repeat(openCurlies - closeCurlies);
  if (closeCurlies > openCurlies) {
    let count = closeCurlies - openCurlies;
    for (let i = repaired.length - 1; i >= 0 && count > 0; i--) {
      if (repaired[i] === '}') {
        repaired = repaired.slice(0, i) + repaired.slice(i + 1);
        count--;
      }
    }
  }
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) repaired += ']';
  return repaired;
}

function parseJsonRobust(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const repaired = tryRepairJson(text);
    return JSON.parse(repaired);
  }
}

// Extract questions from sections array, applying per-question repair
function extractQuestionsFromSections(sections: unknown[]): {
  allQuestions: Record<string, unknown>[];
  diagnostics: ValidationDiagnostic[];
  totalDetected: number;
  discardedCount: number;
} {
  const diagnostics: ValidationDiagnostic[] = [];
  const allQuestions: Record<string, unknown>[] = [];
  let totalDetected = 0;
  let discardedCount = 0;

  for (let si = 0; si < sections.length; si++) {
    const section = sections[si] as Record<string, unknown> | undefined;
    if (!section || typeof section !== 'object') continue;

      const rawQuestions = Array.isArray(section.questions) ? section.questions : [];

      for (let qi = 0; qi < rawQuestions.length; qi++) {
      totalDetected++;
      const rawQ = rawQuestions[qi] as Record<string, unknown> | undefined;
      if (!rawQ || typeof rawQ !== 'object') {
        discardedCount++;
        diagnostics.push({ level: 'error', path: `sections[${si}].questions[${qi}]`, code: 'not_an_object', message: 'Question is not an object' });
        continue;
      }

      const validation = validateSingleQuestion(rawQ, qi);
      if (validation.valid) {
        allQuestions.push(rawQ);
        for (const w of validation.warnings) {
          diagnostics.push({ level: 'warning', path: `sections[${si}].questions[${qi}]`, code: 'question_warning', message: w });
        }
      } else {
        // Try repair via isolateAndRepair (wrap in questions array)
        const singleQJson = JSON.stringify({ questions: [rawQ] });
        const repairResult = isolateAndRepair(singleQJson);
        if (repairResult.recoveredCount > 0) {
          const repaired = repairResult.questions[0].question;
          const repairValidation = validateSingleQuestion(repaired, qi);
          if (repairValidation.valid) {
            allQuestions.push(repaired);
            diagnostics.push({ level: 'warning', path: `sections[${si}].questions[${qi}]`, code: 'repaired', message: `Repaired: ${validation.errors[0] || 'malformed'}` });
          } else {
            discardedCount++;
            diagnostics.push({ level: 'error', path: `sections[${si}].questions[${qi}]`, code: 'unrecoverable', message: `Unrecoverable: ${validation.errors.join('; ')}` });
          }
        } else {
          discardedCount++;
          diagnostics.push({ level: 'error', path: `sections[${si}].questions[${qi}]`, code: 'unrecoverable', message: `Unrecoverable: ${validation.errors.join('; ')}` });
        }
      }
    }
  }

  return { allQuestions, diagnostics, totalDetected, discardedCount };
}

export function parsePaperJson(rawOutput: string): ValidatedPaper {
  const t0 = Date.now();
  console.log(`[PARSE] Input ${rawOutput.length} chars`);

  const cleaned = sanitize(rawOutput);
  const outerJson = findOuterStructure(cleaned);
  if (!outerJson) {
    throw new PaperParseError('AI output contains no JSON structure', rawOutput, true);
  }

  let parsed: unknown;
  try {
    parsed = parseJsonRobust(outerJson);
  } catch {
    // Last resort: use question-level isolation
    const isolation = isolateAndRepair(rawOutput);
    if (isolation.recoveredCount === 0) {
      throw new PaperParseError('AI output is not valid JSON and no recoverable questions found', rawOutput, true);
    }
    const validQuestions = isolation.questions.map(q => q.question);
    const totalMarks = validQuestions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    const paperInput = {
      title: 'Generated Paper',
      totalMarks: Math.max(1, totalMarks),
      sections: [{ title: 'Generated Section', instruction: '', questions: validQuestions }],
    };
    const result = generatedPaperSchema.safeParse(paperInput);
    if (!result.success) {
      throw new PaperParseError(`Paper assembly failed: ${result.error.message.slice(0, 200)}`, rawOutput, true, [], validQuestions);
    }
    return result.data;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new PaperParseError('Parsed JSON is not an object', rawOutput, true);
  }

  // Try to detect common wrappers: { paper: {...} }, { data: {...} }
  const obj = parsed as Record<string, unknown>;
  let inner = obj;
  if (obj.paper && typeof obj.paper === 'object') inner = obj.paper as Record<string, unknown>;
  else if (obj.data && typeof obj.data === 'object') inner = obj.data as Record<string, unknown>;

  // Get sections from inner structure
  const sections = Array.isArray(inner.sections) ? inner.sections : [];

  // If no sections found but we have a questions array at top level, wrap it
  if (sections.length === 0 && Array.isArray(inner.questions)) {
    // Apply per-question validation on the flat questions array
    const { allQuestions, diagnostics } = extractQuestionsFromSections([{ questions: inner.questions }]);

    if (allQuestions.length === 0) {
      // Try isolateAndRepair as last resort
      const isolation = isolateAndRepair(rawOutput);
      if (isolation.recoveredCount === 0) {
        throw new PaperParseError('No valid questions found in output', rawOutput, true);
      }
      const flatQuestions = isolation.questions.map(q => q.question);
      const totalMarks = flatQuestions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
      const paperInput = {
        title: String(inner.title || 'Generated Paper').trim() || 'Generated Paper',
        totalMarks: Math.max(1, totalMarks),
        sections: [{ title: 'Generated Section', instruction: '', questions: flatQuestions }],
      };
      const result = generatedPaperSchema.safeParse(paperInput);
      if (!result.success) throw new PaperParseError(`Assembly failed: ${result.error.message.slice(0, 200)}`, rawOutput, true, diagnostics, flatQuestions);
      return result.data;
    }

    const totalMarks = allQuestions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    const paperInput = {
      title: String(inner.title || 'Generated Paper').trim() || 'Generated Paper',
      totalMarks: Math.max(1, Number(inner.totalMarks) || totalMarks),
      sections: [{ title: 'Generated Section', instruction: '', questions: allQuestions }],
    };
    const result = generatedPaperSchema.safeParse(paperInput);
    if (!result.success) throw new PaperParseError(`Assembly failed: ${result.error.message.slice(0, 200)}`, rawOutput, true, diagnostics, allQuestions);
    return result.data;
  }

  // Sections found: process each question with per-question repair
  if (sections.length > 0) {
    const { allQuestions, diagnostics, discardedCount } = extractQuestionsFromSections(sections);

    if (allQuestions.length === 0) {
      throw new PaperParseError('No valid questions after per-question repair', rawOutput, true, diagnostics);
    }

    // Rebuild sections with repaired questions
    const repairedPaper = {
      title: String(inner.title || 'Generated Paper').trim() || 'Generated Paper',
      totalMarks: Math.max(1, Number(inner.totalMarks) || allQuestions.reduce((s, q) => s + (Number(q.marks) || 1), 0)),
      sections: [{ title: 'Generated Section', instruction: '', questions: allQuestions }],
    };

    const result = generatedPaperSchema.safeParse(repairedPaper);
    if (!result.success) {
      throw new PaperParseError(`Paper assembly failed: ${result.error.message.slice(0, 200)}`, rawOutput, true, diagnostics, allQuestions);
    }

    if (diagnostics.length > 0) {
      console.log(`[PARSE] Repairs: recovered=${allQuestions.length}/${sections.reduce((s, sec) => s + (Array.isArray(sec?.questions) ? sec.questions.length : 0), 0)} discarded=${discardedCount}`);
    }

    console.log(`[PARSE] SUCCESS ${Date.now() - t0}ms | questions=${allQuestions.length}`);
    return result.data;
  }

  // No structures found - try isolateAndRepair as final fallback
  const isolation = isolateAndRepair(rawOutput);
  if (isolation.recoveredCount === 0) {
    throw new PaperParseError('No questions found in AI output', rawOutput, true);
  }

  const validQuestions = isolation.questions.map(q => q.question);
  const totalMarks = validQuestions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
  const paperInput = {
    title: 'Generated Paper',
    totalMarks: Math.max(1, totalMarks),
    sections: [{ title: 'Generated Section', instruction: '', questions: validQuestions }],
  };
  const result = generatedPaperSchema.safeParse(paperInput);
  if (!result.success) throw new PaperParseError(`Assembly failed: ${result.error.message.slice(0, 200)}`, rawOutput, true, [], validQuestions);
  return result.data;
}

export function parsePaperJsonTolerant(rawOutput: string): PaperParseResult {
  const t0 = Date.now();
  console.log(`[PARSE_TOLERANT] Input ${rawOutput.length} chars`);

  const diagnostics: ValidationDiagnostic[] = [];
  const cleaned = sanitize(rawOutput);
  const outerJson = findOuterStructure(cleaned);

  if (!outerJson) {
    const isolation = isolateAndRepair(rawOutput);
    if (isolation.recoveredCount === 0) {
      throw new PaperParseError('No JSON structure and no recoverable questions', rawOutput, true,
        [{ level: 'error', path: 'root', code: 'no_structure', message: 'No valid JSON or questions found' }]);
    }
    const questions = isolation.questions.map(q => q.question);
    const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    const paperInput = { title: 'Generated Paper', totalMarks: Math.max(1, totalMarks), sections: [{ title: 'Generated Section', instruction: '', questions }] };
    const result = generatedPaperSchema.safeParse(paperInput);
    if (!result.success) throw new PaperParseError(`Assembly failed: ${result.error.message.slice(0, 200)}`, rawOutput, true, diagnostics, questions);
    return { paper: result.data, diagnostics, recoveredCount: isolation.recoveredCount, totalDetected: isolation.totalDetected, discardedCount: isolation.discardedCount };
  }

  let parsed: unknown;
  try {
    parsed = parseJsonRobust(outerJson);
  } catch {
    const isolation = isolateAndRepair(rawOutput);
    if (isolation.recoveredCount === 0) throw new PaperParseError('Unrecoverable JSON', rawOutput, true);
    const questions = isolation.questions.map(q => q.question);
    const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    const paperInput = { title: 'Generated Paper', totalMarks: Math.max(1, totalMarks), sections: [{ title: 'Generated Section', instruction: '', questions }] };
    const result = generatedPaperSchema.safeParse(paperInput);
    if (!result.success) throw new PaperParseError(`Assembly failed: ${result.error.message.slice(0, 200)}`, rawOutput, true, [], questions);
    return { paper: result.data, diagnostics: [...diagnostics, { level: 'warning', path: 'root', code: 'json_repaired', message: 'Full JSON repair applied' }], recoveredCount: isolation.recoveredCount, totalDetected: isolation.totalDetected, discardedCount: isolation.discardedCount };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new PaperParseError('Parsed JSON is not an object', rawOutput, true);
  }

  const obj = parsed as Record<string, unknown>;
  let inner = obj;
  if (obj.paper && typeof obj.paper === 'object') inner = obj.paper as Record<string, unknown>;
  else if (obj.data && typeof obj.data === 'object') inner = obj.data as Record<string, unknown>;

  const sections = Array.isArray(inner.sections) ? inner.sections : [];
  let allQuestions: Record<string, unknown>[] = [];
  let totalDetected = 0;
  let discardedCount = 0;

  if (sections.length > 0) {
    const extracted = extractQuestionsFromSections(sections);
    allQuestions = extracted.allQuestions;
    totalDetected = extracted.totalDetected;
    discardedCount = extracted.discardedCount;
    diagnostics.push(...extracted.diagnostics);
  } else if (Array.isArray(inner.questions)) {
    const extracted = extractQuestionsFromSections([{ questions: inner.questions }]);
    allQuestions = extracted.allQuestions;
    totalDetected = extracted.totalDetected;
    discardedCount = extracted.discardedCount;
    diagnostics.push(...extracted.diagnostics);
  }

  if (allQuestions.length === 0) {
    const isolation = isolateAndRepair(rawOutput);
    if (isolation.recoveredCount === 0) throw new PaperParseError('No recoverable questions found', rawOutput, true, diagnostics);
    allQuestions = isolation.questions.map(q => q.question);
    totalDetected = isolation.totalDetected;
    discardedCount = isolation.discardedCount;
  }

  const totalMarks = allQuestions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
  const paperInput = {
    title: String(inner.title || 'Generated Paper').trim() || 'Generated Paper',
    totalMarks: Math.max(1, Number(inner.totalMarks) || totalMarks),
    sections: [{ title: 'Generated Section', instruction: '', questions: allQuestions }],
  };

  const result = generatedPaperSchema.safeParse(paperInput);
  if (!result.success) {
    throw new PaperParseError(`Assembly failed: ${result.error.message.slice(0, 200)}`, rawOutput, true, diagnostics, allQuestions);
  }

  console.log(`[PARSE_TOLERANT] SUCCESS ${Date.now() - t0}ms | questions=${allQuestions.length} total=${totalDetected} discarded=${discardedCount}`);
  return { paper: result.data, diagnostics, recoveredCount: allQuestions.length, totalDetected, discardedCount };
}

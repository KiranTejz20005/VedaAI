import { generatedPaperSchema, type ValidatedPaper } from '../validators/paper.validator';

export class PaperParseError extends Error {
  constructor(
    message: string,
    public readonly rawOutput: string,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'PaperParseError';
  }
}

function extractJson(text: string): string {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return text;
  return text.slice(firstBrace, lastBrace + 1);
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
  const result = generatedPaperSchema.safeParse(wrapped);
  if (!result.success) {
    console.error(`[PARSE] Schema validation FAILED: ${result.error.message.slice(0, 200)}`);
    throw new PaperParseError(`AI output failed validation: ${result.error.message}`, rawOutput, true);
  }
  console.log(`[PARSE] SUCCESS in ${Date.now() - t0}ms | title="${result.data.title}" sections=${result.data.sections.length}`);
  return result.data;
}

function tryEnhanceResult(parsed: unknown): unknown {
  if (typeof parsed !== 'object' || parsed === null) return parsed;
  const obj = parsed as Record<string, unknown>;
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

import { generatedPaperSchema, type ValidatedPaper } from '../validators/paper.validator';
import { logger } from '../utils/logger';

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

export function parsePaperJson(rawOutput: string): ValidatedPaper {
  // Strip any markdown code fences if LLM adds them
  const cleaned = rawOutput
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    logger.error('Failed to parse AI JSON output', { raw: cleaned.slice(0, 500), error: e });
    throw new PaperParseError('AI output is not valid JSON', rawOutput, true);
  }

  const result = generatedPaperSchema.safeParse(parsed);
  if (!result.success) {
    logger.error('AI JSON failed schema validation', { errors: result.error.flatten() });
    throw new PaperParseError(
      `AI output failed validation: ${result.error.message}`,
      rawOutput,
      true
    );
  }

  return result.data;
}

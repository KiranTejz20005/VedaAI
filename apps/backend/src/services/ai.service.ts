import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Job } from 'bullmq';
import { env } from '../config/env';
import type { IAssignment } from '../models/Assignment.model';
import { SYSTEM_PROMPT, buildGenerationPrompt, type QuestionTypeBreakdown } from '../prompts/generation.prompt';
import { PaperParseError, parsePaperJson } from '../parsers/paper.parser';
import type { ValidatedPaper } from '../validators/paper.validator';
import type { GenerationJobData } from '../types/queue.types';
import { logger } from '../utils/logger';
import { withTimeout } from '../utils/timeout';
import {
  ProviderParseError,
  ProviderRateLimitError,
  ProviderTimeoutError,
  ProviderTransportError,
  ProviderUnavailableError,
  ProviderValidationError,
  type ProviderName,
  type ProviderError,
} from './ai/provider-errors';
import { ProviderHealthManager } from './ai/provider-health';
import { buildAdaptiveRetryPrompt, retryDecision } from './ai/retry-manager';
import { evaluatePaperQuality } from './ai/quality-gate';

const MAX_RETRIES = 2;

const PROVIDER_TIMEOUTS: Record<ProviderName, number> = {
  Anthropic: 60_000,
  Gemini: 60_000,
  NVIDIA: 60_000,
};

const health = new ProviderHealthManager();

let nvidiaClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

function correlationIdFor(assignment: IAssignment): string {
  const rawId = (assignment as unknown as { _id?: { toString(): string } })._id?.toString() ?? 'unknown';
  return `gen-${rawId}-${Date.now()}`;
}

function getNvidia(): OpenAI {
  if (!nvidiaClient) {
    nvidiaClient = new OpenAI({
      apiKey: env.NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
      timeout: PROVIDER_TIMEOUTS.NVIDIA,
    });
  }
  return nvidiaClient;
}

function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: PROVIDER_TIMEOUTS.Anthropic });
  }
  return anthropicClient;
}

function getGemini(): GoogleGenerativeAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
  }
  return geminiClient;
}

function enabledProviders(): ProviderName[] {
  const candidates: ProviderName[] = [];
  if (env.ANTHROPIC_API_KEY) candidates.push('Anthropic');
  if (env.GEMINI_API_KEY) candidates.push('Gemini');
  if (env.NVIDIA_API_KEY) candidates.push('NVIDIA');
  return candidates;
}

function isRateLimitMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('429') || lower.includes('rate limit') || lower.includes('too many requests');
}

function isQuotaExceededMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('quota exceeded') ||
    lower.includes('exceeded your current quota') ||
    lower.includes('free_tier_requests') ||
    lower.includes('insufficient quota')
  );
}

interface ProviderCallInput {
  provider: ProviderName;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  correlationId: string;
}

async function callProvider(input: ProviderCallInput): Promise<string> {
  const { provider, systemPrompt, userPrompt, temperature, correlationId } = input;

  if (!health.canAttempt(provider)) {
    throw new ProviderUnavailableError(provider, `${provider} currently unhealthy (circuit/quarantine)`);
  }

  const t0 = Date.now();
  logger.info(`[AI_CALL] correlationId=${correlationId} provider=${provider} promptLen=${userPrompt.length} temp=${temperature}`);

  try {
    if (provider === 'NVIDIA') {
      const timeoutMs = PROVIDER_TIMEOUTS.NVIDIA;
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await getNvidia().chat.completions.create(
          {
            model: 'meta/llama-3.2-3b-instruct',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature,
            max_tokens: 2048,
          },
          { signal: controller.signal } as unknown as undefined
        );
        const text = response.choices[0]?.message?.content ?? '';
        logger.info(`[NVIDIA_RAW_RESPONSE] correlationId=${correlationId} ${text.replace(/\s+/g, ' ').slice(0, 1400)}`);
        health.recordSuccess('NVIDIA', Date.now() - t0);
        return text;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          health.recordTimeoutFailure('NVIDIA');
          throw new ProviderTimeoutError('NVIDIA', `NVIDIA timed out after ${timeoutMs}ms`);
        }
        const message = error instanceof Error ? error.message : String(error);
        if (isRateLimitMessage(message)) {
          const quotaExceeded = isQuotaExceededMessage(message);
          health.recordRateLimitFailure('NVIDIA', quotaExceeded);
          throw new ProviderRateLimitError('NVIDIA', message, quotaExceeded);
        }
        health.recordTransportFailure('NVIDIA');
        throw new ProviderTransportError('NVIDIA', message);
      } finally {
        clearTimeout(timeoutHandle);
      }
    }

    if (provider === 'Gemini') {
      const model = getGemini().getGenerativeModel({ model: 'gemini-2.0-flash' });
      const response = await withTimeout(
        model.generateContent(`${systemPrompt}\n\n${userPrompt}`),
        PROVIDER_TIMEOUTS.Gemini,
        'Gemini'
      );
      const text = response.response.text();
      health.recordSuccess('Gemini', Date.now() - t0);
      return text;
    }

    const response = await withTimeout(
      getAnthropic().messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: [{ type: 'text', text: userPrompt }] }],
      }),
      PROVIDER_TIMEOUTS.Anthropic,
      'Anthropic'
    );
    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';
    health.recordSuccess('Anthropic', Date.now() - t0);
    return text;
  } catch (error) {
    if (error instanceof ProviderTimeoutError || error instanceof ProviderRateLimitError || error instanceof ProviderTransportError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);

    if (provider === 'Gemini') {
      if (isRateLimitMessage(message)) {
        const quotaExceeded = isQuotaExceededMessage(message);
        health.recordRateLimitFailure('Gemini', quotaExceeded);
        throw new ProviderRateLimitError('Gemini', message, quotaExceeded);
      }
      if (message.toLowerCase().includes('timed out')) {
        health.recordTimeoutFailure('Gemini');
        throw new ProviderTimeoutError('Gemini', message);
      }
      health.recordTransportFailure('Gemini');
      throw new ProviderTransportError('Gemini', message);
    }

    if (isRateLimitMessage(message)) {
      const quotaExceeded = isQuotaExceededMessage(message);
      health.recordRateLimitFailure('Anthropic', quotaExceeded);
      throw new ProviderRateLimitError('Anthropic', message, quotaExceeded);
    }
    if (message.toLowerCase().includes('timed out')) {
      health.recordTimeoutFailure('Anthropic');
      throw new ProviderTimeoutError('Anthropic', message);
    }
    health.recordTransportFailure('Anthropic');
    throw new ProviderTransportError('Anthropic', message);
  }
}

function parseProviderOutput(provider: ProviderName, rawOutput: string): ValidatedPaper {
  try {
    return parsePaperJson(rawOutput);
  } catch (error) {
    if (error instanceof PaperParseError) {
      const onlyValidationErrors = error.diagnostics.length > 0 && error.diagnostics.every((d) => d.level === 'error');
      if (onlyValidationErrors) {
        health.recordValidationFailure(provider);
        throw new ProviderValidationError(provider, error.message, error.diagnostics.map((d) => `${d.path}: ${d.message}`));
      }
      health.recordParseFailure(provider);
      throw new ProviderParseError(provider, error.message);
    }
    throw error;
  }
}

function buildRepairPrompt(rawOutput: string): string {
  return `Repair the following model output into strict valid JSON. Output only JSON.\n\n${rawOutput}`;
}

interface ProviderAttemptResult {
  paper?: ValidatedPaper;
  error?: ProviderError;
}

async function runProviderWithRetry(
  provider: ProviderName,
  assignment: IAssignment,
  typeBreakdown: QuestionTypeBreakdown[] | undefined,
  initialPrompt: string,
  correlationId: string
): Promise<ProviderAttemptResult> {
  let prompt = initialPrompt;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const temperature = attempt === 1 ? 0.2 : 0.05;

    try {
      const rawOutput = await callProvider({
        provider,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: prompt,
        temperature,
        correlationId,
      });
      const paper = parseProviderOutput(provider, rawOutput);

      const quality = evaluatePaperQuality(assignment, paper, typeBreakdown);
      logger.info(
        `[QUALITY_GATE] correlationId=${correlationId} provider=${provider} requestedQuestions=${quality.requestedQuestionCount} generatedQuestions=${quality.generatedQuestionCount} requestedMarks=${quality.requestedMarks} generatedMarks=${quality.generatedMarks} ok=${quality.ok}`
      );
      if (!quality.ok) {
        health.recordValidationFailure(provider);
        throw new ProviderValidationError(provider, 'Generated paper failed integrity quality gate', quality.diagnostics);
      }

      return { paper };
    } catch (error) {
      if (!(error instanceof Error)) {
        return { error: new ProviderTransportError(provider, String(error)) };
      }

      if (error instanceof ProviderValidationError || error instanceof ProviderParseError) {
        try {
          const repaired = await callProvider({
            provider,
            systemPrompt: 'You are a strict JSON normalizer. Return only valid JSON.',
            userPrompt: `${buildRepairPrompt(prompt)}\n\nConstraint reminder: return EXACT requested question count and marks total.`,
            temperature: 0,
            correlationId,
          });
          const paper = parseProviderOutput(provider, repaired);

          const quality = evaluatePaperQuality(assignment, paper, typeBreakdown);
          logger.info(
            `[QUALITY_GATE] correlationId=${correlationId} provider=${provider} mode=repair requestedQuestions=${quality.requestedQuestionCount} generatedQuestions=${quality.generatedQuestionCount} requestedMarks=${quality.requestedMarks} generatedMarks=${quality.generatedMarks} ok=${quality.ok}`
          );
          if (!quality.ok) {
            health.recordValidationFailure(provider);
            throw new ProviderValidationError(provider, 'Repaired output failed integrity quality gate', quality.diagnostics);
          }

          return { paper };
        } catch (repairError) {
          if (repairError instanceof ProviderValidationError) {
            logger.warn(
              `[QUALITY_GATE] correlationId=${correlationId} provider=${provider} validationFailure diagnostics=${repairError.diagnostics.join(' | ')}`
            );
          }
          const decision = retryDecision(attempt, { provider, correlationId, maxAttempts: MAX_RETRIES }, true);
          if (!decision.shouldRetry) {
            return { error };
          }
          prompt = buildAdaptiveRetryPrompt(initialPrompt, error.message);
          await new Promise((resolve) => setTimeout(resolve, decision.delayMs));
          continue;
        }
      }

      if (
        error instanceof ProviderRateLimitError ||
        error instanceof ProviderTimeoutError ||
        error instanceof ProviderTransportError ||
        error instanceof ProviderUnavailableError
      ) {
        const decision = retryDecision(attempt, { provider, correlationId, maxAttempts: MAX_RETRIES }, error.retryable);
        if (!decision.shouldRetry) {
          return { error };
        }
        await new Promise((resolve) => setTimeout(resolve, decision.delayMs));
        continue;
      }

      return { error: new ProviderTransportError(provider, error.message) };
    }
  }

  return { error: new ProviderTransportError(provider, `${provider} exhausted retry budget`) };
}

export async function generatePaper(
  assignment: IAssignment,
  uploadedContent?: string,
  typeBreakdown?: QuestionTypeBreakdown[],
  job?: Job<GenerationJobData>
): Promise<ValidatedPaper> {
  const started = Date.now();
  const correlationId = correlationIdFor(assignment);

  const progress = async (value: number) => {
    if (!job) return;
    try {
      await job.updateProgress(value);
    } catch {
      // ignore progress channel errors
    }
  };

  await progress(10);
  const prompt = buildGenerationPrompt(assignment, uploadedContent, typeBreakdown);
  await progress(20);

  const providers = health
    .orderedProviders(enabledProviders())
    .filter((provider) => health.canAttempt(provider));

  logger.info(`[AI_ROUTER] correlationId=${correlationId} providers=${providers.join(' -> ') || '(none)'} score=${JSON.stringify(health.statsSnapshot())}`);

  if (providers.length === 0) {
    throw new Error('All AI providers unavailable (not configured or unhealthy)');
  }

  const errors: string[] = [];

  for (const provider of providers) {
    await progress(30);
    logger.info(`[GENERATE:30%] correlationId=${correlationId} provider=${provider} attemptStart`);

    const result = await runProviderWithRetry(provider, assignment, typeBreakdown, prompt, correlationId);
    if (result.paper) {
      await progress(50);
      logger.info(`[GENERATE:50%] correlationId=${correlationId} provider=${provider} raw->paper success`);
      await progress(70);
      await progress(85);
      logger.info(`[GENERATE:COMPLETE] correlationId=${correlationId} provider=${provider} durationMs=${Date.now() - started}`);
      return result.paper;
    }

    if (result.error) {
      errors.push(`${provider}: ${result.error.message}`);
      logger.warn(`[AI_ROUTER] correlationId=${correlationId} provider=${provider} failed reason=${result.error.message}`);
    }
  }

  throw new Error(`All AI providers failed (${Date.now() - started}ms): ${errors.join(' | ')}`);
}

function buildAnswersPrompt(paper: ValidatedPaper): string {
  let questionsList = '';
  for (const section of paper.sections) {
    for (const q of section.questions) {
      const typeLabel = q.type === 'mcq' ? `(MCQ:${q.options?.map((o) => `${o.key}.${o.text}`).join('|')})` : `(${q.type})`;
      questionsList += `Q:${q.id}|${typeLabel}|${q.marks}m|${q.question}\n`;
    }
  }
  return `Generate model answers for each question. Output JSON array: [{"questionId":"uuid","answer":{"text":"...","explanation":"..."}}]\n\nQuestions:\n${questionsList}`;
}

function parseAnswersJson(rawOutput: string): Array<{ questionId: string; answer: { text: string; explanation?: string } }> {
  const cleaned = rawOutput
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  const jsonStr = firstBracket !== -1 && lastBracket > firstBracket ? cleaned.slice(firstBracket, lastBracket + 1) : cleaned;
  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) throw new Error('Answers response is not an array');
  return parsed;
}

export async function generateAnswersForPaper(paper: ValidatedPaper): Promise<ValidatedPaper> {
  const questionsNeedingAnswers = paper.sections.flatMap((s) => s.questions).filter((q) => !q.answer);
  if (questionsNeedingAnswers.length === 0) return paper;

  const prompt = buildAnswersPrompt(paper);
  const providers = health.orderedProviders(enabledProviders()).filter((provider) => health.canAttempt(provider));
  if (providers.length === 0) return paper;

  for (const provider of providers) {
    try {
      const rawOutput = await callProvider({
        provider,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: prompt,
        temperature: 0.1,
        correlationId: `ans-${Date.now()}`,
      });
      const answers = parseAnswersJson(rawOutput);
      const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));
      const paperObj = JSON.parse(JSON.stringify(paper)) as ValidatedPaper;
      for (const section of paperObj.sections) {
        for (const q of section.questions) {
          const answer = answerMap.get(q.id);
          if (answer) q.answer = answer;
        }
      }
      return paperObj;
    } catch {
      // Non-fatal for answer generation; continue to next provider.
    }
  }

  return paper;
}

export function getProviderHealthSnapshot() {
  return health.statsSnapshot();
}

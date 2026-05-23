import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { Job } from 'bullmq';
import { env } from '../config/env';
import type { IAssignment } from '../models/Assignment.model';
import { SYSTEM_PROMPT, buildBatchGenerationPrompt, type QuestionTypeBreakdown } from '../prompts/generation.prompt';
import type { ValidatedPaper } from '../validators/paper.validator';
import type { GenerationJobData } from '../types/queue.types';
import { logger } from '../utils/logger';
import { withTimeout } from '../utils/timeout';
import { jsonrepair } from 'jsonrepair';
import { z } from 'zod';
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
import { buildAdaptiveRetryPrompt, retryDecision, buildSmartRetryPrompt } from './ai/retry-manager';
import { evaluatePaperQuality, type QualityGateResult } from './ai/quality-gate';
import { createGenerationPlan, type PlannedBatch } from './ai/generation-planner';
import { buildCompactSyllabusContext } from './ai/syllabus-preprocessor';
import { validateBatchResponse, type BatchQuestion } from './ai/batch-validator';
import { assemblePaperFromBatches } from './ai/paper-assembler';
import type { GenerationStage } from '../types/socket.types';
const MAX_RETRIES = 2;

const PROVIDER_TIMEOUTS: Record<ProviderName, number> = {
  Anthropic: 90_000,
  NVIDIA: 90_000,
  Groq: 90_000,
};

const health = new ProviderHealthManager();

const answerEntrySchema = z.object({
  questionId: z.string().uuid(),
  answer: z.object({
    text: z.string().min(1),
    explanation: z.string().optional(),
  }).strict(),
}).strict();

const answerEntriesSchema = z.array(answerEntrySchema).min(1);

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function isLikelyTruncatedJson(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (const char of trimmed) {
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{' || char === '[') depth += 1;
    if (char === '}' || char === ']') depth -= 1;
  }

  return inString || depth !== 0;
}

function parseStrictJson(rawOutput: string): unknown {
  const cleaned = stripCodeFences(rawOutput);
  if (isLikelyTruncatedJson(cleaned)) {
    throw new Error('AI output appears truncated');
  }

  return JSON.parse(jsonrepair(cleaned)) as unknown;
}

function parseAnswersPayload(rawOutput: string): Array<{ questionId: string; answer: { text: string; explanation?: string } }> {
  const parsed = parseStrictJson(rawOutput);

  let candidate: unknown[] | null = null;
  if (Array.isArray(parsed)) {
    candidate = parsed;
  } else if (typeof parsed === 'object' && parsed !== null) {
    const record = parsed as Record<string, unknown>;
    if (Array.isArray(record.answers)) {
      candidate = record.answers;
    } else if ('questionId' in record && 'answer' in record) {
      candidate = [record];
    }
  }

  if (!candidate) {
    throw new Error('Answers response is not an array');
  }

  const validation = answerEntriesSchema.safeParse(candidate);
  if (!validation.success) {
    throw new Error(`Answers response failed validation: ${validation.error.message}`);
  }

  const seen = new Set<string>();
  for (const entry of validation.data) {
    if (seen.has(entry.questionId)) {
      throw new Error(`Duplicate answer questionId: ${entry.questionId}`);
    }
    seen.add(entry.questionId);
  }

  return validation.data;
}

let nvidiaClient: OpenAI | null = null;
let groqClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;

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

function getGroq(): OpenAI {
  if (!groqClient) {
    groqClient = new OpenAI({
      apiKey: env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      timeout: PROVIDER_TIMEOUTS.Groq,
    });
  }
  return groqClient;
}

function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: PROVIDER_TIMEOUTS.Anthropic });
  }
  return anthropicClient;
}

function enabledProviders(): ProviderName[] {
  const candidates: ProviderName[] = [];
  if (env.ANTHROPIC_API_KEY) candidates.push('Anthropic');
  if (env.NVIDIA_API_KEY) candidates.push('NVIDIA');
  if (env.GROQ_API_KEY) candidates.push('Groq');
  return candidates;
}

function chooseAdaptiveBatchSize(providers: ProviderName[]): number {
  const primary = providers[0] ?? 'NVIDIA';
  const baseline: Record<ProviderName, number> = {
    NVIDIA: 3,
    Groq: 4,
    Anthropic: 7,
  };
  const stats = health.statsSnapshot()[primary];
  let size = baseline[primary];

  if (stats) {
    const totalCorruption = stats.validationFailures + stats.parseFailures + stats.timeoutFailures;
    const totalAttempts = Math.max(1, stats.requests);
    const corruptionRate = totalCorruption / totalAttempts;
    if (corruptionRate > 0.25) size = Math.max(2, size - 2);
    else if (stats.successes >= 5 && corruptionRate < 0.1) size = Math.min(8, size + 1);
  }

  return size;
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

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.message.includes('cancelled') || error.message.includes('aborted'));
}

interface ProviderCallInput {
  provider: ProviderName;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  correlationId: string;
  signal?: AbortSignal;
}

const IMAGE_PATH_PATTERN = /\S*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\b/gi;

function sanitizePrompt(text: string): string {
  return text
    .replace(/\b(?:data:)?image\/[a-z0-9+.]+;base64[^\s"'()]+\b/gi, '')
    .replace(/\b(?:https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?))\b/gi, '')
    .replace(IMAGE_PATH_PATTERN, '')
    .replace(/(?:[\w\-./\\()]+\/)?[\w\-.() ]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\b/gi, '')
    .replace(/\bimage\s*\.\s*(?:png|jpg|jpeg|gif|webp)\b/gi, '')
    .replace(/\(\s*(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\s*\)/gi, '')
    .replace(/[""'][^"']*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)[""']/gi, '')
    .replace(/\b(?:fig(?:ure)?|img|image|picture|photo|screenshot)\s*[:#]\s*\S+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\b/gi, '');
}

async function callProvider(input: ProviderCallInput): Promise<string> {
  const { provider, systemPrompt, userPrompt, temperature, correlationId, signal } = input;

  if (signal?.aborted) {
    throw new ProviderTransportError(provider, `${provider} aborted before call`);
  }

  if (!health.canAttempt(provider)) {
    throw new ProviderUnavailableError(provider, `${provider} currently unhealthy (circuit/quarantine)`);
  }

  const t0 = Date.now();
  logger.info(`[AI_CALL] correlationId=${correlationId} provider=${provider} promptLen=${userPrompt.length} temp=${temperature}`);

  const sanitizedUserPrompt = sanitizePrompt(userPrompt);
  const sanitizedSystemPrompt = sanitizePrompt(systemPrompt);

  try {
    if (provider === 'NVIDIA') {
      const timeoutMs = PROVIDER_TIMEOUTS.NVIDIA;
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

      const onParentAbort = () => {
        controller.abort();
      };
      if (signal) {
        if (signal.aborted) {
          clearTimeout(timeoutHandle);
          throw new ProviderTransportError('NVIDIA', 'NVIDIA cancelled by parent');
        }
        signal.addEventListener('abort', onParentAbort, { once: true });
      }

      try {
        const response = await getNvidia().chat.completions.create(
          {
            model: 'meta/llama-3.1-8b-instruct',
            messages: [
              { role: 'system', content: sanitizedSystemPrompt },
              { role: 'user', content: sanitizedUserPrompt },
            ],
            temperature,
            max_tokens: 4096,
          },
          { signal: controller.signal } as unknown as undefined
        );
        const text = response.choices[0]?.message?.content ?? '';
        logger.info(`[NVIDIA_RAW_RESPONSE] correlationId=${correlationId} ${text.replace(/\s+/g, ' ').slice(0, 1400)}`);
        health.recordSuccess('NVIDIA', Date.now() - t0);
        return text;
      } catch (error) {
        if (isAbortError(error)) {
          health.recordTimeoutFailure('NVIDIA');
          throw new ProviderTimeoutError('NVIDIA', `NVIDIA timed out or cancelled after ${timeoutMs}ms`);
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
        if (signal) {
          signal.removeEventListener('abort', onParentAbort);
        }
      }
    }

    if (provider === 'Groq') {
      const timeoutMs = PROVIDER_TIMEOUTS.Groq;
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

      const onParentAbort = () => {
        controller.abort();
      };
      if (signal) {
        if (signal.aborted) {
          clearTimeout(timeoutHandle);
          throw new ProviderTransportError('Groq', 'Groq cancelled by parent');
        }
        signal.addEventListener('abort', onParentAbort, { once: true });
      }

      try {
        const response = await getGroq().chat.completions.create(
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: sanitizedSystemPrompt },
              { role: 'user', content: sanitizedUserPrompt },
            ],
            temperature,
            max_tokens: 4096,
          },
          { signal: controller.signal } as unknown as undefined
        );
        const text = response.choices[0]?.message?.content ?? '';
        logger.info(`[GROQ_RAW_RESPONSE] correlationId=${correlationId} ${text.replace(/\s+/g, ' ').slice(0, 1400)}`);
        health.recordSuccess('Groq', Date.now() - t0);
        return text;
      } catch (error) {
        if (isAbortError(error)) {
          health.recordTimeoutFailure('Groq');
          throw new ProviderTimeoutError('Groq', `Groq timed out or cancelled after ${timeoutMs}ms`);
        }
        const message = error instanceof Error ? error.message : String(error);
        if (isRateLimitMessage(message)) {
          const quotaExceeded = isQuotaExceededMessage(message);
          health.recordRateLimitFailure('Groq', quotaExceeded);
          throw new ProviderRateLimitError('Groq', message, quotaExceeded);
        }
        health.recordTransportFailure('Groq');
        throw new ProviderTransportError('Groq', message);
      } finally {
        clearTimeout(timeoutHandle);
        if (signal) {
          signal.removeEventListener('abort', onParentAbort);
        }
      }
    }

    if (signal?.aborted) {
      throw new ProviderTransportError('Anthropic', 'Anthropic cancelled by parent');
    }

        const response = await withTimeout(
      getAnthropic().messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: sanitizedSystemPrompt,
        messages: [{ role: 'user', content: [{ type: 'text', text: sanitizedUserPrompt }] }],
      }),
      PROVIDER_TIMEOUTS.Anthropic,
      'Anthropic',
      signal
    );
    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';
    health.recordSuccess('Anthropic', Date.now() - t0);
    return text;
  } catch (error) {
    if (isAbortError(error)) {
      throw new ProviderTimeoutError(provider, `${provider} cancelled`);
    }

    if (error instanceof ProviderTimeoutError || error instanceof ProviderRateLimitError || error instanceof ProviderTransportError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);

    if (provider === 'Groq') {
      if (isRateLimitMessage(message)) {
        const quotaExceeded = isQuotaExceededMessage(message);
        health.recordRateLimitFailure('Groq', quotaExceeded);
        throw new ProviderRateLimitError('Groq', message, quotaExceeded);
      }
      if (message.toLowerCase().includes('timed out')) {
        health.recordTimeoutFailure('Groq');
        throw new ProviderTimeoutError('Groq', message);
      }
      health.recordTransportFailure('Groq');
      throw new ProviderTransportError('Groq', message);
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

interface BatchAttemptResult {
  questions?: BatchQuestion[];
  status?: 'complete' | 'partial' | 'failed';
  partial?: boolean;
  completionRate?: number;
  diagnostics?: string[];
  repairCount?: number;
  discardCount?: number;
  totalDetected?: number;
  malformedNodeCount?: number;
  repairTypes?: string[];
  salvageRate?: number;
  error?: ProviderError;
}

export interface GenerationOutcome {
  status: 'complete' | 'partial_success' | 'failed';
  paper: ValidatedPaper;
  quality: QualityGateResult;
  generatedQuestions: number;
  requestedQuestions: number;
  generatedMarks: number;
  requestedMarks: number;
  recoveredQuestions: number;
  discardedQuestions: number;
  completedBatches: number;
  failedBatches: number;
  diagnostics: string[];
}

async function runBatchWithRetry(
  provider: ProviderName,
  assignment: IAssignment,
  batch: PlannedBatch,
  syllabusContext: string,
  correlationId: string,
  signal?: AbortSignal
): Promise<BatchAttemptResult> {
  if (signal?.aborted) {
    return { error: new ProviderTransportError(provider, 'Batch cancelled before start') };
  }

  let prompt = buildBatchGenerationPrompt(
    assignment,
    {
      batchId: batch.id,
      type: batch.type,
      count: batch.count,
      marksPerQuestion: batch.marksPerQuestion,
      allowedMarks: [batch.marksPerQuestion],
      totalMarks: batch.totalMarks,
      allowedTypes: batch.allowedTypes,
      sectionTitle: batch.sectionTitle,
      difficultyHint: batch.difficultyHint,
    },
    syllabusContext
  );

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) {
      return { error: new ProviderTransportError(provider, 'Batch cancelled during retry') };
    }

    const temperature = attempt === 1 ? 0.15 : 0.05;

    try {
      const rawOutput = await callProvider({
        provider,
        systemPrompt: 'You generate small JSON batches for an exam paper. Output JSON only.',
        userPrompt: prompt,
        temperature,
        correlationId,
        signal,
      });

      const validation = validateBatchResponse(rawOutput, {
        batchId: batch.id,
        expectedCount: batch.count,
        expectedMarks: batch.totalMarks,
        allowedTypes: batch.allowedTypes,
        allowedMarks: [batch.marksPerQuestion],
        expectedType: batch.type,
      });

      logger.info(
        `[BATCH_GATE] correlationId=${correlationId} provider=${provider} batch=${batch.id} ` +
        `requested=${batch.count} generated=${validation.generatedCount} ` +
        `ok=${validation.ok} status=${validation.status} completionRate=${validation.completionRate.toFixed(2)} ` +
        `detected=${validation.totalDetected} repairs=${validation.repairCount} discarded=${validation.discardCount} ` +
        `malformed=${validation.malformedNodeCount} salvageRate=${validation.salvageRate.toFixed(2)} ` +
        `repairTypes=${validation.repairTypes.join(',') || 'none'}`
      );

      if (validation.questions.length > 0) {
        return {
          questions: validation.questions,
          status: validation.status,
          partial: validation.status !== 'complete',
          completionRate: validation.completionRate,
          diagnostics: validation.diagnostics,
          repairCount: validation.repairCount,
          discardCount: validation.discardCount,
          totalDetected: validation.totalDetected,
          malformedNodeCount: validation.malformedNodeCount,
          repairTypes: validation.repairTypes,
          salvageRate: validation.salvageRate,
        };
      }

      health.recordValidationFailure(provider);
      throw new ProviderValidationError(
        provider,
        `Batch ${batch.id} failed strict validation: ${validation.diagnostics.join(' | ') || 'no valid questions'}`,
        validation.diagnostics
      );
    } catch (error) {
      if (signal?.aborted) {
        return { error: new ProviderTransportError(provider, 'Batch cancelled during error handling') };
      }

      if (!(error instanceof Error)) {
        return { error: new ProviderTransportError(provider, String(error)) };
      }

      const msg = error.message;

      // ── Image-reference error: re-sanitize prompt aggressively and retry same provider ──
      if (
        msg.includes('does not support image') ||
        msg.includes('Cannot read') ||
        (msg.includes('image') && (msg.includes('.png') || msg.includes('.jpg') || msg.includes('.jpeg')))
      ) {
        logger.warn(`[BATCH] correlationId=${correlationId} provider=${provider} image ref detected, re-sanitizing prompt`);
        health.recordValidationFailure(provider);
        prompt = prompt
          .replace(/\S*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\b/gi, '')
          .replace(/data:image\/[^;]+;base64[^"'\s)]+/gi, '')
          .replace(/\(?\s*(?:see|refer|check|view|look at)\s*:?\s*[^)\n]*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\s*\)?/gi, '')
          .replace(/!\[.*?\]\(.*?\)/g, '')
          .replace(/\[.*?\]\(.*?\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\)/g, '')
          .replace(/['"`]\S*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\S*['"`]/gi, '')
          .replace(/\bimage\s*\.\s*(?:png|jpg|jpeg|gif|webp)\b/gi, '');
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        return { error: new ProviderTransportError(provider, `Image references in uploaded content could not be fully removed: ${msg}`) };
      }

      if (
        error instanceof ProviderValidationError ||
        error instanceof ProviderParseError ||
        error instanceof ProviderTransportError ||
        error instanceof ProviderTimeoutError ||
        error instanceof ProviderRateLimitError ||
        error instanceof ProviderUnavailableError
      ) {
        const decision = retryDecision(attempt, { provider, correlationId, maxAttempts: MAX_RETRIES }, error.retryable);
        if (!decision.shouldRetry) {
          return { error };
        }

        prompt = buildAdaptiveRetryPrompt(prompt, error.message);
        await new Promise((resolve) => setTimeout(resolve, decision.delayMs));
        continue;
      }

      return { error: new ProviderTransportError(provider, error.message) };
    }
  }

  return { error: new ProviderTransportError(provider, `${provider} exhausted batch retry budget`) };
}

export async function generatePaper(
  assignment: IAssignment,
  uploadedContent?: string,
  typeBreakdown?: QuestionTypeBreakdown[],
  job?: Job<GenerationJobData>,
  onStage?: (stage: GenerationStage, progress: number, message: string) => Promise<void>,
  signal?: AbortSignal
): Promise<GenerationOutcome> {
  const started = Date.now();
  const correlationId = correlationIdFor(assignment);

  const progress = async (value: number) => {
    if (signal?.aborted) return;
    if (!job) return;
    try {
      await job.updateProgress(value);
    } catch {
      // ignore progress channel errors
    }
  };

  const stage = async (stageName: GenerationStage, value: number, message: string) => {
    if (signal?.aborted) return;
    await progress(value);
    if (onStage) {
      await onStage(stageName, value, message);
    }
  };

  if (signal?.aborted) {
    throw new Error('Generation cancelled before start');
  }

  await stage('extracting_content', 10, 'Extracting and parsing source content...');
  const syllabusContext = buildCompactSyllabusContext(uploadedContent);
  const providers = health
    .orderedProviders(enabledProviders())
    .filter((provider) => health.canAttempt(provider));

  logger.info(`[AI_ROUTER] correlationId=${correlationId} providers=${providers.join(' -> ') || '(none)'} score=${JSON.stringify(health.statsSnapshot())}`);

  if (providers.length === 0) {
    throw new Error('All AI providers unavailable (not configured or unhealthy)');
  }

  const maxBatchQuestions = chooseAdaptiveBatchSize(providers);
  const plan = createGenerationPlan(assignment, typeBreakdown, { maxBatchQuestions });
  logger.info(
    `[GENERATION_PLAN] correlationId=${correlationId} batches=${plan.batches.length} ` +
    `maxBatchQuestions=${plan.maxBatchQuestions} contextChars=${syllabusContext.length}`
  );
  await stage('generation_planning', 28, 'Preparing generation batches...');

  const completedBatches: Array<{ plan: PlannedBatch; questions: BatchQuestion[] }> = [];
  const batchErrors: string[] = [];
  let totalRecovered = 0;
  let totalRequested = 0;
  let totalDiscarded = 0;

  for (let batchIndex = 0; batchIndex < plan.batches.length; batchIndex++) {
    if (signal?.aborted) {
      throw new Error('Generation cancelled during batch processing');
    }
    const batch = plan.batches[batchIndex]!;
    totalRequested += batch.count;
    const batchStart = Date.now();
    const realProgress = plan.totalQuestions > 0 ? Math.round((totalRecovered / plan.totalQuestions) * 100) : 0;
    await stage('batch_generating', realProgress, `Generating batch ${batchIndex + 1}/${plan.batches.length}...`);
    logger.info(
      `[BATCH_START] correlationId=${correlationId} batch=${batch.id} type=${batch.type} count=${batch.count} marks=${batch.totalMarks}`
    );

    let batchSuccess = false;

    for (const provider of providers) {
      if (signal?.aborted) {
        throw new Error('Generation cancelled during provider fallback');
      }
      const result = await runBatchWithRetry(provider, assignment, batch, syllabusContext, correlationId, signal);

      if (result.questions && result.questions.length > 0) {
        completedBatches.push({ plan: batch, questions: result.questions });
        totalRecovered += result.questions.length;
        totalDiscarded += result.discardCount ?? 0;
        batchSuccess = true;

        if (result.partial && result.questions.length < batch.count) {
          const missingCount = batch.count - result.questions.length;
          logger.info(
            `[SMART_RETRY] correlationId=${correlationId} batch=${batch.id} recovered=${result.questions.length}/${batch.count} requesting=${missingCount} more`
          );
          await stage('validation_retry', 72, `Validating recovery batch for ${batch.id}...`);

          const retryPrompt = buildSmartRetryPrompt({
            missingCount: batch.count - result.questions.length,
            missingTypes: batch.allowedTypes,
            marksPerQuestion: batch.marksPerQuestion,
            allowedMarks: [batch.marksPerQuestion],
            difficultyHint: batch.difficultyHint,
            syllabusContext,
            sectionTitle: batch.sectionTitle,
          });

          try {
            const rawRetryOutput = await callProvider({
              provider,
              systemPrompt: 'Generate only the requested number of questions. Output JSON only.',
              userPrompt: retryPrompt,
              temperature: 0.1,
              correlationId: `${correlationId}-retry`,
              signal,
            });

            const retryValidation = validateBatchResponse(rawRetryOutput, {
              batchId: `${batch.id}-retry`,
              expectedCount: missingCount,
              expectedMarks: missingCount * batch.marksPerQuestion,
              allowedTypes: batch.allowedTypes,
              allowedMarks: [batch.marksPerQuestion],
              expectedType: batch.type,
            });

            if (retryValidation.questions.length > 0) {
              const retryQuestions = retryValidation.questions.slice(0, missingCount);
              const existingEntry = completedBatches.find((e) => e.plan.id === batch.id);
              if (existingEntry) {
                existingEntry.questions.push(...retryQuestions);
              } else {
                completedBatches.push({ plan: batch, questions: retryQuestions });
              }
              totalRecovered += retryQuestions.length;
              totalDiscarded += retryValidation.discardCount;
              logger.info(
                `[SMART_RETRY_OK] correlationId=${correlationId} recovered=${retryQuestions.length}/${missingCount} ` +
                `detected=${retryValidation.totalDetected} repairs=${retryValidation.repairCount} discarded=${retryValidation.discardCount} ` +
                `malformed=${retryValidation.malformedNodeCount} salvageRate=${retryValidation.salvageRate.toFixed(2)}`
              )
            }
          } catch (retryError) {
            if (signal?.aborted) {
              throw new Error('Generation cancelled during smart retry');
            }
            logger.warn(`[SMART_RETRY_ERR] correlationId=${correlationId} ${retryError instanceof Error ? retryError.message : String(retryError)}`);
          }
        }

        logger.info(
          `[BATCH_COMPLETE] correlationId=${correlationId} batch=${batch.id} provider=${provider} recvd=${result.questions.length}/${batch.count} durationMs=${Date.now() - batchStart}`
        );
        break;
      }

      if (result.error) {
        batchErrors.push(`${provider}: ${result.error.message}`);
        logger.warn(
          `[BATCH_FAIL] correlationId=${correlationId} batch=${batch.id} provider=${provider} reason=${result.error.message}`
        );
      }
    }

    if (!batchSuccess) {
      batchErrors.push(`batch ${batch.id}: all providers exhausted`);
      logger.warn(`[BATCH_EXHAUSTED] correlationId=${correlationId} batch=${batch.id} no valid questions from any provider`);
    }

    const afterProgress = plan.totalQuestions > 0 ? Math.round((totalRecovered / plan.totalQuestions) * 100) : 0;
    await stage(
      'batch_generating',
      afterProgress,
      `Batch ${batchIndex + 1}/${plan.batches.length} complete`
    );
  }

  if (totalRecovered < plan.totalQuestions) {
    let rescueAttempts = 0;
    const maxRescueAttempts = 2;

    while (totalRecovered < plan.totalQuestions && rescueAttempts < maxRescueAttempts) {
      if (signal?.aborted) {
        throw new Error('Generation cancelled during recovery');
      }
      const remaining = plan.totalQuestions - totalRecovered;
      rescueAttempts += 1;
      await stage('recovering_batches', 75, `Recovering missing questions (${remaining} remaining)...`);

      const fallbackBatch: PlannedBatch = {
        id: `rescue-${rescueAttempts}`,
        type: (assignment.questionConfig.types[0] ?? 'short-answer') as PlannedBatch['type'],
        count: remaining,
        marksPerQuestion: Math.max(1, Math.round(assignment.totalMarks / Math.max(1, assignment.questionConfig.count))),
        totalMarks: Math.max(1, Math.round(assignment.totalMarks / Math.max(1, assignment.questionConfig.count))) * remaining,
        allowedTypes: assignment.questionConfig.types,
        sectionTitle: 'Recovery Questions',
        difficultyHint: 'medium',
      };

      for (const provider of providers) {
        if (signal?.aborted) {
          throw new Error('Generation cancelled during provider recovery');
        }
        await stage('provider_retry', 76, `Trying ${provider} for recovery...`);
        const rescue = await runBatchWithRetry(provider, assignment, fallbackBatch, syllabusContext, `${correlationId}-rescue-${rescueAttempts}`, signal);
        if (!rescue.questions || rescue.questions.length === 0) continue;

        const rescuedQuestions = rescue.questions.slice(0, remaining);
        completedBatches.push({ plan: fallbackBatch, questions: rescuedQuestions });
        totalRecovered += rescuedQuestions.length;
        totalDiscarded += rescue.discardCount ?? 0;
        break;
      }
    }
  }

  if (totalRecovered === 0) {
    throw new Error(`All batches failed, zero questions generated (${Date.now() - started}ms): ${batchErrors.join(' | ')}`);
  }

  const paper = assemblePaperFromBatches(assignment, completedBatches);
  const quality = evaluatePaperQuality(assignment, paper, typeBreakdown);
  const outcome: GenerationOutcome['status'] = quality.status;

  logger.info(
    `[FINAL_GATE] correlationId=${correlationId} requestedQuestions=${quality.requestedQuestionCount} ` +
    `generatedQuestions=${quality.generatedQuestionCount} requestedMarks=${quality.requestedMarks} ` +
    `generatedMarks=${quality.generatedMarks} ok=${quality.ok} partial=${quality.partialSuccess} status=${quality.status}`
  );

  if (quality.status === 'partial_success') {
    logger.warn(
      `[PARTIAL_COMPLETE] correlationId=${correlationId} durationMs=${Date.now() - started} ` +
      `batches=${completedBatches.length} recovered=${totalRecovered}/${totalRequested} ` +
      `discarded=${totalDiscarded} diagnostics=${JSON.stringify(quality.diagnostics.slice(0, 5))}`
    );
  } else if (quality.status === 'complete') {
    logger.info(
      `[GENERATE:COMPLETE] correlationId=${correlationId} durationMs=${Date.now() - started} ` +
      `batches=${completedBatches.length} questions=${totalRecovered} discarded=${totalDiscarded}`
    );
  } else {
    logger.warn(
      `[GENERATE:FAILED_WITH_CONTENT] correlationId=${correlationId} durationMs=${Date.now() - started} ` +
      `batches=${completedBatches.length} questions=${totalRecovered} discarded=${totalDiscarded} ` +
      `diagnostics=${JSON.stringify(quality.diagnostics.slice(0, 5))}`
    );
  }

  await stage('validating', 84, 'Validating generated paper quality...');
  return {
    status: outcome,
    paper,
    quality,
    generatedQuestions: quality.generatedQuestionCount,
    requestedQuestions: quality.requestedQuestionCount,
    generatedMarks: quality.generatedMarks,
    requestedMarks: quality.requestedMarks,
    recoveredQuestions: totalRecovered,
    discardedQuestions: totalDiscarded,
    completedBatches: completedBatches.length,
    failedBatches: batchErrors.length,
    diagnostics: quality.diagnostics,
  };
}

export async function generateAnswersForPaper(paper: ValidatedPaper, signal?: AbortSignal): Promise<ValidatedPaper> {
  const questionsNeedingAnswers = paper.sections.flatMap((s) => s.questions).filter((q) => !q.answer);
  if (questionsNeedingAnswers.length === 0) return paper;

  const providers = health.orderedProviders(enabledProviders()).filter((provider) => health.canAttempt(provider));
  if (providers.length === 0) {
    throw new Error('No provider available for answer-key generation');
  }

  const paperObj = JSON.parse(JSON.stringify(paper)) as ValidatedPaper;
  const questionsById = new Map(questionsNeedingAnswers.map((question) => [question.id, question]));
  const unresolvedIds = new Set(questionsNeedingAnswers.map((question) => question.id));
  const batchSize = Math.min(3, Math.max(1, questionsNeedingAnswers.length));
  const maxPasses = Math.max(2, Math.ceil(questionsNeedingAnswers.length / batchSize));

  for (let pass = 0; pass < maxPasses && unresolvedIds.size > 0; pass += 1) {
    if (signal?.aborted) {
      throw new Error('Answer generation cancelled');
    }
    const currentQuestions = questionsNeedingAnswers.filter((question) => unresolvedIds.has(question.id));
    for (let index = 0; index < currentQuestions.length; index += batchSize) {
      if (signal?.aborted) {
        throw new Error('Answer generation cancelled during batch');
      }
      const batch = currentQuestions.slice(index, index + batchSize);
      const questionsList = batch
        .map((question) => {
          const typeLabel = question.type === 'mcq' && question.options ? `(MCQ:${question.options.map((option) => `${option.key}.${option.text}`).join('|')})` : `(${question.type})`;
          return `Q:${question.id}|${typeLabel}|${question.marks}m|${question.question}`;
        })
        .join('\n');

      const prompt = `Generate model answers for the questions below. Return ONLY JSON. Return ONLY an array of objects in this exact shape: [{"questionId":"uuid","answer":{"text":"...","explanation":"..."}}]. Do not wrap the array in an object. Do not include markdown or extra keys.\n\nQuestions:\n${questionsList}`;

      let batchAnswers: Array<{ questionId: string; answer: { text: string; explanation?: string } }> | null = null;
      let lastError: Error | null = null;

      for (const provider of providers) {
        if (signal?.aborted) {
          throw new Error('Answer generation cancelled during provider fallback');
        }
        try {
          const rawOutput = await callProvider({
            provider,
            systemPrompt: SYSTEM_PROMPT,
            userPrompt: prompt,
            temperature: 0.1,
            correlationId: `ans-${Date.now()}-${index}`,
            signal,
          });
          const answers = parseAnswersPayload(rawOutput);
          if (answers.length === 0) {
            throw new Error('No answers returned');
          }

          const expectedIds = new Set(batch.map((question) => question.id));
          let matchedCount = 0;
          for (const answer of answers) {
            if (!expectedIds.has(answer.questionId)) {
              continue;
            }
            matchedCount += 1;
            unresolvedIds.delete(answer.questionId);
          }

          if (matchedCount === 0) {
            throw new Error('No matching questionIds returned');
          }

          batchAnswers = answers;
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
        }
      }

      if (!batchAnswers) {
        throw lastError ?? new Error('Answer-key generation failed');
      }

      const answerMap = new Map(batchAnswers.map((answer) => [answer.questionId, answer.answer]));
      for (const question of questionsById.values()) {
        const answer = answerMap.get(question.id);
        if (!answer) continue;

        for (const section of paperObj.sections) {
          const target = section.questions.find((item) => item.id === question.id);
          if (target) {
            target.answer = answer;
            break;
          }
        }
      }
    }
  }

  if (unresolvedIds.size > 0) {
    logger.warn(`[ANSWERS] Answer-key generation incomplete: ${unresolvedIds.size} question(s) still missing answers — persisting with partial answers`);
  }

  return paperObj;
}

export function getProviderHealthSnapshot() {
  return health.statsSnapshot();
}

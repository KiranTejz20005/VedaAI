import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Job } from 'bullmq';
import { env } from '../config/env';
import type { IAssignment } from '../models/Assignment.model';
import { SYSTEM_PROMPT, buildBatchGenerationPrompt, type QuestionTypeBreakdown } from '../prompts/generation.prompt';
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
import { buildAdaptiveRetryPrompt, retryDecision, buildSmartRetryPrompt } from './ai/retry-manager';
import { evaluatePaperQuality } from './ai/quality-gate';
import { createGenerationPlan, type PlannedBatch } from './ai/generation-planner';
import { buildCompactSyllabusContext } from './ai/syllabus-preprocessor';
import { validateBatchResponse, type BatchQuestion } from './ai/batch-validator';
import { assemblePaperFromBatches } from './ai/paper-assembler';
import type { GenerationStage } from '../types/socket.types';

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

function chooseAdaptiveBatchSize(providers: ProviderName[]): number {
  const primary = providers[0] ?? 'NVIDIA';
  const baseline: Record<ProviderName, number> = {
    NVIDIA: 3,
    Gemini: 5,
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

interface BatchAttemptResult {
  questions?: BatchQuestion[];
  partial?: boolean;
  diagnostics?: string[];
  repairCount?: number;
  discardCount?: number;
  totalDetected?: number;
  malformedNodeCount?: number;
  repairTypes?: string[];
  salvageRate?: number;
  error?: ProviderError;
}

async function runBatchWithRetry(
  provider: ProviderName,
  assignment: IAssignment,
  batch: PlannedBatch,
  syllabusContext: string,
  correlationId: string
): Promise<BatchAttemptResult> {
  let prompt = buildBatchGenerationPrompt(
    assignment,
    {
      batchId: batch.id,
      type: batch.type,
      count: batch.count,
      marksPerQuestion: batch.marksPerQuestion,
      totalMarks: batch.totalMarks,
      allowedTypes: batch.allowedTypes,
      sectionTitle: batch.sectionTitle,
      difficultyHint: batch.difficultyHint,
    },
    syllabusContext
  );

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const temperature = attempt === 1 ? 0.15 : 0.05;

    try {
      const rawOutput = await callProvider({
        provider,
        systemPrompt: 'You generate small JSON batches for an exam paper. Output JSON only.',
        userPrompt: prompt,
        temperature,
        correlationId,
      });

      const validation = validateBatchResponse(rawOutput, {
        batchId: batch.id,
        expectedCount: batch.count,
        expectedMarks: batch.totalMarks,
        allowedTypes: batch.allowedTypes,
        expectedType: batch.type,
      });

      logger.info(
        `[BATCH_GATE] correlationId=${correlationId} provider=${provider} batch=${batch.id} ` +
        `requested=${batch.count} generated=${validation.generatedCount} ` +
        `ok=${validation.ok} partial=${validation.generatedCount < batch.count} ` +
        `detected=${validation.totalDetected} repairs=${validation.repairCount} discarded=${validation.discardCount} ` +
        `malformed=${validation.malformedNodeCount} salvageRate=${validation.salvageRate.toFixed(2)} ` +
        `repairTypes=${validation.repairTypes.join(',') || 'none'}`
      );

      // Accept partial recovery: even if !ok but we have questions, use them
      if (validation.questions.length > 0) {
        return {
          questions: validation.questions,
          partial: validation.generatedCount < batch.count,
          diagnostics: validation.diagnostics,
          repairCount: validation.repairCount,
          discardCount: validation.discardCount,
          totalDetected: validation.totalDetected,
          malformedNodeCount: validation.malformedNodeCount,
          repairTypes: validation.repairTypes,
          salvageRate: validation.salvageRate,
        };
      }

      // No questions recovered at all - fail the batch
      health.recordValidationFailure(provider);
      throw new ProviderValidationError(provider, `Batch ${batch.id} produced zero valid questions`, validation.diagnostics);
    } catch (error) {
      if (!(error instanceof Error)) {
        return { error: new ProviderTransportError(provider, String(error)) };
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
  onStage?: (stage: GenerationStage, progress: number, message: string) => Promise<void>
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

  const stage = async (stageName: GenerationStage, value: number, message: string) => {
    await progress(value);
    if (onStage) {
      await onStage(stageName, value, message);
    }
  };

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
    const batch = plan.batches[batchIndex]!;
    totalRequested += batch.count;
    const batchStart = Date.now();
    const progressBase = 40 + Math.floor((batchIndex / Math.max(1, plan.batches.length)) * 35);
    await stage('batch_generating', progressBase, `Generating batch ${batchIndex + 1}/${plan.batches.length}...`);
    logger.info(
      `[BATCH_START] correlationId=${correlationId} batch=${batch.id} type=${batch.type} count=${batch.count} marks=${batch.totalMarks}`
    );

    let batchSuccess = false;

    for (const provider of providers) {
      const result = await runBatchWithRetry(provider, assignment, batch, syllabusContext, correlationId);

      if (result.questions && result.questions.length > 0) {
        completedBatches.push({ plan: batch, questions: result.questions });
        totalRecovered += result.questions.length;
        totalDiscarded += result.discardCount ?? 0;
        batchSuccess = true;

        // Smart retry: if partial recovery, try to get missing questions
        if (result.partial && result.questions.length < batch.count) {
          const missingCount = batch.count - result.questions.length;
          logger.info(
            `[SMART_RETRY] correlationId=${correlationId} batch=${batch.id} recovered=${result.questions.length}/${batch.count} requesting=${missingCount} more`
          );

          const retryPrompt = buildSmartRetryPrompt({
            missingCount: batch.count - result.questions.length,
            missingTypes: batch.allowedTypes,
            marksPerQuestion: batch.marksPerQuestion,
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
            });

            const retryValidation = validateBatchResponse(rawRetryOutput, {
              batchId: `${batch.id}-retry`,
              expectedCount: missingCount,
              expectedMarks: missingCount * batch.marksPerQuestion,
              allowedTypes: batch.allowedTypes,
              expectedType: batch.type,
            });

            if (retryValidation.questions.length > 0) {
              const retryQuestions = retryValidation.questions.slice(0, missingCount);
              completedBatches.push({ plan: batch, questions: retryQuestions });
              totalRecovered += retryQuestions.length;
              totalDiscarded += retryValidation.discardCount;
              logger.info(
                `[SMART_RETRY_OK] correlationId=${correlationId} recovered=${retryQuestions.length}/${missingCount} ` +
                `detected=${retryValidation.totalDetected} repairs=${retryValidation.repairCount} discarded=${retryValidation.discardCount} ` +
                `malformed=${retryValidation.malformedNodeCount} salvageRate=${retryValidation.salvageRate.toFixed(2)}`
              );
            } else {
              logger.warn(`[SMART_RETRY_FAIL] correlationId=${correlationId} zero additional questions recovered`);
            }
          } catch (retryError) {
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

    await stage(
      'batch_generating',
      40 + Math.floor(((batchIndex + 1) / Math.max(1, plan.batches.length)) * 35),
      `Batch ${batchIndex + 1}/${plan.batches.length} complete`
    );
  }

  if (totalRecovered < plan.totalQuestions) {
    let rescueAttempts = 0;
    const maxRescueAttempts = Math.min(6, Math.max(2, plan.totalQuestions - totalRecovered));

    while (totalRecovered < plan.totalQuestions && rescueAttempts < maxRescueAttempts) {
      const remaining = plan.totalQuestions - totalRecovered;
      rescueAttempts += 1;
      await stage('batch_generating', 75, `Recovering missing questions (${remaining} remaining)...`);

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
        const rescue = await runBatchWithRetry(provider, assignment, fallbackBatch, syllabusContext, `${correlationId}-rescue-${rescueAttempts}`);
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

  logger.info(
    `[FINAL_GATE] correlationId=${correlationId} requestedQuestions=${quality.requestedQuestionCount} ` +
    `generatedQuestions=${quality.generatedQuestionCount} requestedMarks=${quality.requestedMarks} ` +
    `generatedMarks=${quality.generatedMarks} ok=${quality.ok} partial=${quality.partialSuccess}`
  );

  if (!quality.ok) {
    throw new ProviderValidationError('NVIDIA', 'Final assembled paper failed quality gate', quality.diagnostics);
  }

  if (quality.partialSuccess) {
    logger.warn(
      `[PARTIAL_COMPLETE] correlationId=${correlationId} durationMs=${Date.now() - started} ` +
      `batches=${completedBatches.length} recovered=${totalRecovered}/${totalRequested} ` +
      `discarded=${totalDiscarded} diagnostics=${JSON.stringify(quality.diagnostics.slice(0, 5))}`
    );
  } else {
    logger.info(
      `[GENERATE:COMPLETE] correlationId=${correlationId} durationMs=${Date.now() - started} ` +
      `batches=${completedBatches.length} questions=${totalRecovered} discarded=${totalDiscarded}`
    );
  }

  await stage('validating', 84, 'Validating generated paper quality...');
  return paper;
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
  if (providers.length === 0) {
    throw new Error('No provider available for answer-key generation');
  }

  let lastError: Error | null = null;
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
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error('Answer-key generation failed');
}

export function getProviderHealthSnapshot() {
  return health.statsSnapshot();
}

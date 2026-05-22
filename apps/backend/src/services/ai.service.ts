import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { SYSTEM_PROMPT, buildGenerationPrompt, type QuestionTypeBreakdown } from '../prompts/generation.prompt';
import { parsePaperJson, PaperParseError } from '../parsers/paper.parser';
import type { IAssignment } from '../models/Assignment.model';
import type { ValidatedPaper } from '../validators/paper.validator';
const MAX_RETRIES = 2;

const PROVIDER_TIMEOUTS: Record<string, number> = {
  NVIDIA:    30_000,
  Gemini:    30_000,
  Anthropic: 30_000,
};

interface CircuitState {
  failures: number;
  lastFailure: number;
  open: boolean;
  cooldownMs: number;
  consecutiveFailures: number;
}

const circuitBreakers = new Map<string, CircuitState>();

function getCircuitState(provider: string): CircuitState {
  let state = circuitBreakers.get(provider);
  if (!state) {
    state = { failures: 0, lastFailure: 0, open: false, cooldownMs: 10_000, consecutiveFailures: 0 };
    circuitBreakers.set(provider, state);
  }
  return state;
}

function isCircuitOpen(provider: string): boolean {
  const state = getCircuitState(provider);
  if (!state.open) return false;
  const elapsed = Date.now() - state.lastFailure;
  if (elapsed > state.cooldownMs) {
    console.log(`[CIRCUIT_BREAKER] ${provider} cooldown ${state.cooldownMs}ms elapsed — resetting`);
    state.open = false;
    state.cooldownMs = Math.min(state.cooldownMs * 2, 120_000);
    state.failures = 0;
    state.consecutiveFailures = 0;
    return false;
  }
  console.log(`[CIRCUIT_BREAKER] ${provider} open (${elapsed}ms / ${state.cooldownMs}ms cooldown)`);
  return true;
}

function recordFailure(provider: string): void {
  const state = getCircuitState(provider);
  state.failures++;
  state.lastFailure = Date.now();
  state.consecutiveFailures++;
  if (state.consecutiveFailures >= 3) {
    state.open = true;
    console.log(`[CIRCUIT_BREAKER] ${provider} OPEN after ${state.consecutiveFailures} consecutive failures (cooldown=${state.cooldownMs}ms)`);
  }
}

function recordSuccess(provider: string): void {
  const state = getCircuitState(provider);
  state.consecutiveFailures = 0;
  state.failures = 0;
  if (state.cooldownMs > 10_000) {
    state.cooldownMs = Math.max(10_000, state.cooldownMs / 2);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

let _nvidia: OpenAI | null = null;
let _anthropic: Anthropic | null = null;
let _gemini: GoogleGenerativeAI | null = null;

const DISABLED_PROVIDERS = new Set<string>();

function checkProviderStartup(): void {
  if (env.OPENAI_API_KEY) {
    DISABLED_PROVIDERS.add('OpenAI');
    console.log(`[AI_PROVIDER] OpenAI key present but DISABLED — invalid API key. Remove OPENAI_API_KEY from .env or set a valid key.`);
  }
  if (env.NVIDIA_API_KEY) {
    console.log(`[AI_PROVIDER] NVIDIA enabled`);
  } else {
    console.log(`[AI_PROVIDER] NVIDIA not configured — skipping`);
  }
  if (env.GEMINI_API_KEY) {
    console.log(`[AI_PROVIDER] Gemini enabled`);
  } else {
    console.log(`[AI_PROVIDER] Gemini not configured — skipping`);
  }
  if (env.ANTHROPIC_API_KEY) {
    console.log(`[AI_PROVIDER] Anthropic enabled`);
  } else {
    console.log(`[AI_PROVIDER] Anthropic not configured — skipping`);
  }
  const enabled = [env.NVIDIA_API_KEY, env.GEMINI_API_KEY, env.ANTHROPIC_API_KEY].filter(Boolean).length;
  if (enabled === 0) {
    console.error(`[AI_PROVIDER] NO AI PROVIDERS CONFIGURED. Set at least one of: NVIDIA_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY`);
  }
}

checkProviderStartup();

function getAnthropic(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 30_000 });
  return _anthropic;
}

function getGemini(): GoogleGenerativeAI {
  if (!_gemini) _gemini = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
  return _gemini;
}

function getNvidia(): OpenAI {
  if (!_nvidia) {
    _nvidia = new OpenAI({
      apiKey: env.NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
      timeout: PROVIDER_TIMEOUTS.NVIDIA,
    });
  }
  return _nvidia;
}

async function generateWithNvidia(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!env.NVIDIA_API_KEY) throw new Error('NVIDIA API key not configured');
  if (DISABLED_PROVIDERS.has('NVIDIA')) throw new Error('NVIDIA disabled by health check');
  if (isCircuitOpen('NVIDIA')) throw new Error('NVIDIA circuit breaker open');
  const t0 = Date.now();
  console.log(`[AI_PROVIDER] NVIDIA request start | prompt=${userPrompt.length} chars | timeout=${PROVIDER_TIMEOUTS.NVIDIA}ms`);
  const response = await withTimeout(
    getNvidia().chat.completions.create({
      model: 'meta/llama-3.2-3b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    }),
    PROVIDER_TIMEOUTS.NVIDIA,
    'NVIDIA'
  );
  const text = response.choices[0]?.message?.content ?? '';
  const elapsed = Date.now() - t0;
  console.log(`[AI_PROVIDER] NVIDIA response in ${elapsed}ms | ${text.length} chars`);
  if (elapsed > 20_000) console.log(`[AI_PROVIDER] NVIDIA SLOW RESPONSE: ${elapsed}ms`);
  return text;
}

async function generateWithGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new Error('Gemini API key not configured');
  if (DISABLED_PROVIDERS.has('Gemini')) throw new Error('Gemini disabled by health check');
  if (isCircuitOpen('Gemini')) throw new Error('Gemini circuit breaker open');
  const t0 = Date.now();
  const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
  console.log(`[AI_PROVIDER] Gemini request start | prompt=${combinedPrompt.length} chars | timeout=${PROVIDER_TIMEOUTS.Gemini}ms`);
  const model = getGemini().getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await withTimeout(
    model.generateContent(combinedPrompt),
    PROVIDER_TIMEOUTS.Gemini,
    'Gemini'
  );
  const text = result.response.text();
  const elapsed = Date.now() - t0;
  console.log(`[AI_PROVIDER] Gemini response in ${elapsed}ms | ${text.length} chars`);
  if (elapsed > 20_000) console.log(`[AI_PROVIDER] Gemini SLOW RESPONSE: ${elapsed}ms`);
  return text;
}

async function generateWithAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) throw new Error('Anthropic API key not configured');
  if (DISABLED_PROVIDERS.has('Anthropic')) throw new Error('Anthropic disabled by health check');
  if (isCircuitOpen('Anthropic')) throw new Error('Anthropic circuit breaker open');
  const t0 = Date.now();
  console.log(`[AI_PROVIDER] Anthropic request start | prompt=${userPrompt.length} chars | timeout=${PROVIDER_TIMEOUTS.Anthropic}ms`);
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
  const block = response.content[0];
  const text = block.type === 'text' ? block.text : '';
  const elapsed = Date.now() - t0;
  console.log(`[AI_PROVIDER] Anthropic response in ${elapsed}ms | ${text.length} chars`);
  if (elapsed > 20_000) console.log(`[AI_PROVIDER] Anthropic SLOW RESPONSE: ${elapsed}ms`);
  return text;
}

function isRateLimitError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return lower.includes('rate limit') || lower.includes('429') || lower.includes('too many requests');
}

function isAuthError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return lower.includes('401') || lower.includes('unauthorized') || lower.includes('api key') || lower.includes('auth');
}

type ProviderFn = (system: string, user: string) => Promise<string>;

function getProviderChain(): Array<{ name: string; fn: ProviderFn }> {
  const providers: Array<{ name: string; fn: ProviderFn; key: string | undefined }> = [
    { name: 'NVIDIA', fn: generateWithNvidia, key: env.NVIDIA_API_KEY },
    { name: 'Gemini', fn: generateWithGemini, key: env.GEMINI_API_KEY },
    { name: 'Anthropic', fn: generateWithAnthropic, key: env.ANTHROPIC_API_KEY },
  ];
  const chain = providers
    .filter((p) => Boolean(p.key) && !DISABLED_PROVIDERS.has(p.name) && !isCircuitOpen(p.name))
    .map(({ name, fn }) => ({ name, fn }));
  console.log(`[AI_PROVIDER] Provider chain: ${chain.map(p => p.name).join(' → ') || '(empty)'}`);
  return chain;
}

export async function generatePaper(
  assignment: IAssignment,
  uploadedContent?: string,
  typeBreakdown?: QuestionTypeBreakdown[]
): Promise<ValidatedPaper> {
  const genStart = Date.now();
  console.log(`[REQUEST_START] assignment=${(assignment as any)._id} uploaded=${uploadedContent?.length ?? 0}chars`);

  let userPrompt = buildGenerationPrompt(assignment, uploadedContent, typeBreakdown);
  console.log(`[PROMPT_SIZE] ${userPrompt.length} chars`);

  const providers = getProviderChain();

  if (providers.length === 0) {
    console.error(`[AI_PROVIDER] No providers available`);
    throw new Error('All AI providers unavailable (not configured, disabled, or circuit breakers open)');
  }

  const errors: string[] = [];

  for (const { name, fn } of providers) {
    console.log(`[AI_PROVIDER] Trying ${name}`);
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const attemptStart = Date.now();
      try {
        console.log(`[RETRY] ${name} attempt ${attempt}/${MAX_RETRIES}`);
        const rawOutput = await fn(SYSTEM_PROMPT, userPrompt);
        console.log(`[REQUEST_END] ${name} attempt ${attempt} done in ${Date.now() - attemptStart}ms | response=${rawOutput.length} chars`);
        console.log(`[PARSE] Validating ${name} output`);
        const paper = parsePaperJson(rawOutput);
        recordSuccess(name);
        const totalQs = paper.sections.reduce((s, sec) => s + sec.questions.length, 0);
        console.log(`[COMPLETE] ${name} success in ${Date.now() - genStart}ms | title="${paper.title}" sections=${paper.sections.length} questions=${totalQs}`);
        return paper;
      } catch (error) {
        const elapsed = Date.now() - attemptStart;
        const msg = error instanceof Error ? error.message : String(error);
        console.log(`[AI_PROVIDER] ${name} attempt ${attempt} FAILED at ${elapsed}ms: ${msg}`);
        if (isAuthError(msg)) {
          console.log(`[AI_PROVIDER] ${name} auth error — DISABLING provider`);
          DISABLED_PROVIDERS.add(name);
          errors.push(`${name}: Auth error — provider disabled`);
          break;
        }
        if (isRateLimitError(msg)) {
          console.log(`[AI_PROVIDER] ${name} rate limited — backing off`);
          const backoffMs = 10000 * attempt + Math.random() * 3000;
          if (attempt >= MAX_RETRIES) {
            console.log(`[AI_PROVIDER] ${name} max rate limit retries — skipping`);
            errors.push(`${name}[${attempt}]: rate limited (max retries)`);
            break;
          }
          console.log(`[AI_PROVIDER] ${name} waiting ${Math.round(backoffMs)}ms before retry`);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          errors.push(`${name}[${attempt}]: rate limited`);
          continue;
        }
        if (error instanceof PaperParseError && !error.retryable) {
          console.log(`[AI_PROVIDER] ${name} non-retryable parse error`);
          errors.push(`${name}: ${msg}`);
          break;
        }
        if (elapsed >= PROVIDER_TIMEOUTS[name] - 1000) {
          console.log(`[AI_PROVIDER] ${name} TIMEOUT — skipping retry, trying next provider`);
          recordFailure(name);
          errors.push(`${name}[${attempt}]: timeout after ${elapsed}ms`);
          break;
        }
        recordFailure(name);
        errors.push(`${name}[${attempt}]: ${msg} (${elapsed}ms)`);
        if (attempt < MAX_RETRIES) {
          const delay = Math.min(2000 * attempt, 8000) + Math.random() * 1000;
          console.log(`[RETRY] ${name} retry ${attempt}→${attempt + 1} in ${Math.round(delay)}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  const totalTime = Date.now() - genStart;
  const errorMsg = `All AI providers failed (${totalTime}ms): ${errors.join(' | ')}`;
  console.log(`[AI_PROVIDER] ${errorMsg}`);
  throw new Error(errorMsg);
}

function buildAnswersPrompt(paper: ValidatedPaper): string {
  let questionsList = '';
  for (const section of paper.sections) {
    for (const q of section.questions) {
      const typeLabel = q.type === 'mcq' ? `(MCQ:${q.options?.map(o => `${o.key}.${o.text}`).join('|')})` : `(${q.type})`;
      questionsList += `Q:${q.id}|${typeLabel}|${q.marks}m|${q.question}\n`;
    }
  }
  return `Generate model answers for each question. Output JSON array: [{"questionId":"uuid","answer":{"text":"...","explanation":"..."}}]

Questions:
${questionsList}

Rules: MCQ=correct option key, true-false=correct bool, short-answer=model answer, long-answer=detailed answer, fill-blank=fill word.`;
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
  const questionsNeedingAnswers = paper.sections
    .flatMap(s => s.questions)
    .filter(q => !q.answer);
  if (questionsNeedingAnswers.length === 0) {
    console.log(`[ANSWERS] No questions need answers — skipping`);
    return paper;
  }
  console.log(`[ANSWERS] Generating answers for ${questionsNeedingAnswers.length} questions`);
  const prompt = buildAnswersPrompt(paper);
  console.log(`[ANSWERS_PROMPT] ${prompt.length} chars`);
  const providers = getProviderChain();
  if (providers.length === 0) {
    console.warn(`[ANSWERS] No providers available — returning paper without answers`);
    return paper;
  }
  const errors: string[] = [];
  for (const { name, fn } of providers) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const rawOutput = await fn(SYSTEM_PROMPT, prompt);
        const answers = parseAnswersJson(rawOutput);
        const answerMap = new Map(answers.map(a => [a.questionId, a.answer]));
        const paperObj = JSON.parse(JSON.stringify(paper));
        for (const section of paperObj.sections) {
          for (const q of section.questions) {
            const answer = answerMap.get(q.id);
            if (answer) q.answer = answer;
          }
        }
        const filled = questionsNeedingAnswers.length - answers.length;
        console.log(`[ANSWERS] ${name} returned ${answers.length} answers (${filled} missing)`);
        return paperObj as ValidatedPaper;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(`[ANSWERS] ${name} attempt ${attempt} FAILED: ${msg}`);
        errors.push(`${name}[${attempt}]: ${msg}`);
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        }
      }
    }
  }
  console.warn(`[ANSWERS] All providers failed: ${errors.join(' | ')} — returning paper without answers`);
  return paper;
}

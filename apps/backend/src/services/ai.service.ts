import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { SYSTEM_PROMPT, buildGenerationPrompt, type QuestionTypeBreakdown } from '../prompts/generation.prompt';
import { parsePaperJson, PaperParseError } from '../parsers/paper.parser';
import type { IAssignment } from '../models/Assignment.model';
import type { ValidatedPaper } from '../validators/paper.validator';
import { logger } from '../utils/logger';

const MAX_RETRIES = 2;
const AI_TIMEOUT_MS = 90_000;

const circuitBreakers = new Map<string, { failures: number; lastFailure: number; open: boolean }>();

function isCircuitOpen(provider: string): boolean {
  const state = circuitBreakers.get(provider);
  if (!state || !state.open) return false;
  const elapsed = Date.now() - state.lastFailure;
  if (elapsed > 60_000) {
    circuitBreakers.set(provider, { failures: 0, lastFailure: 0, open: false });
    return false;
  }
  return true;
}

function recordFailure(provider: string): void {
  const state = circuitBreakers.get(provider) || { failures: 0, lastFailure: 0, open: false };
  state.failures++;
  state.lastFailure = Date.now();
  if (state.failures >= 3) state.open = true;
  circuitBreakers.set(provider, state);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`AI request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: AI_TIMEOUT_MS });
  return _openai;
}

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return _anthropic;
}

let _gemini: GoogleGenerativeAI | null = null;
function getGemini(): GoogleGenerativeAI {
  if (!_gemini) _gemini = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
  return _gemini;
}

let _nvidia: OpenAI | null = null;
function getNvidia(): OpenAI {
  if (!_nvidia) {
    _nvidia = new OpenAI({
      apiKey: env.NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
      timeout: AI_TIMEOUT_MS,
    });
  }
  return _nvidia;
}

async function generateWithOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!env.OPENAI_API_KEY) throw new Error('OpenAI API key not configured');
  if (isCircuitOpen('OpenAI')) throw new Error('OpenAI circuit breaker open');
  const response = await withTimeout(
    getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4000,
    }),
    AI_TIMEOUT_MS
  );
  return response.choices[0]?.message?.content ?? '';
}

async function generateWithAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) throw new Error('Anthropic API key not configured');
  if (isCircuitOpen('Anthropic')) throw new Error('Anthropic circuit breaker open');
  const response = await withTimeout(
    getAnthropic().messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: [{ type: 'text', text: userPrompt }] }],
    }),
    AI_TIMEOUT_MS
  );
  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}

async function generateWithGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new Error('Gemini API key not configured');
  if (isCircuitOpen('Gemini')) throw new Error('Gemini circuit breaker open');
  const model = getGemini().getGenerativeModel({ model: 'gemini-1.5-pro' });
  const result = await withTimeout(
    model.generateContent(`${systemPrompt}\n\n${userPrompt}`),
    AI_TIMEOUT_MS
  );
  return result.response.text();
}

async function generateWithNvidia(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!env.NVIDIA_API_KEY) throw new Error('NVIDIA API key not configured');
  if (isCircuitOpen('NVIDIA')) throw new Error('NVIDIA circuit breaker open');
  const response = await withTimeout(
    getNvidia().chat.completions.create({
      model: 'meta/llama-3.1-70b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
    AI_TIMEOUT_MS
  );
  return response.choices[0]?.message?.content ?? '';
}

type ProviderFn = (system: string, user: string) => Promise<string>;

function getProviderChain(): Array<{ name: string; fn: ProviderFn }> {
  const providers: Array<{ name: string; fn: ProviderFn; key: string | undefined }> = [
    { name: 'NVIDIA', fn: generateWithNvidia, key: env.NVIDIA_API_KEY },
    { name: 'OpenAI', fn: generateWithOpenAI, key: env.OPENAI_API_KEY },
    { name: 'Anthropic', fn: generateWithAnthropic, key: env.ANTHROPIC_API_KEY },
    { name: 'Gemini', fn: generateWithGemini, key: env.GEMINI_API_KEY },
  ];
  return providers
    .filter((p) => Boolean(p.key) && !isCircuitOpen(p.name))
    .map(({ name, fn }) => ({ name, fn }));
}

const IMAGE_EXT_RE = /\S*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\b/gi;
const IMAGE_PATH_RE = /[\w\-./\\()]+\/(?:[\w\-./() ]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?))/gi;
const IMAGE_DOT_RE = /\bimage\s*\.\s*(png|jpg|jpeg|gif|webp)\b/gi;
const IMAGE_PAREN_RE = /\(\s*(?:png|jpg|jpeg|gif|webp|svg|bmp|ico)\s*\)/gi;

function sanitizePrompt(text: string): string {
  return text
    .replace(IMAGE_EXT_RE, ' [FILE REFERENCE REMOVED] ')
    .replace(IMAGE_PATH_RE, ' [FILE PATH REMOVED] ')
    .replace(IMAGE_DOT_RE, ' [IMAGE REF REMOVED] ')
    .replace(IMAGE_PAREN_RE, ' [IMAGE FORMAT REMOVED] ')
    .replace(/\bbase64\b/gi, '[BINARY DATA REMOVED]');
}

function isImageInputError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (lower.includes('image') || lower.includes('file') || lower.includes('read')) &&
    (lower.includes('not support') || lower.includes('cannot read') || lower.includes('file input') || lower.includes('image input') || lower.includes('base64'));
}

export async function generatePaper(
  assignment: IAssignment,
  uploadedContent?: string,
  typeBreakdown?: QuestionTypeBreakdown[]
): Promise<ValidatedPaper> {
  let userPrompt = buildGenerationPrompt(assignment, uploadedContent, typeBreakdown);
  // Always sanitize to prevent AI SDKs from misinterpreting text as file/image references
  userPrompt = sanitizePrompt(userPrompt);
  const providers = getProviderChain();

  if (providers.length === 0) {
    throw new Error('No AI provider configured or all circuit breakers open');
  }

  const errors: string[] = [];

  for (const { name, fn } of providers) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        logger.info(`AI generation with ${name} (attempt ${attempt}/${MAX_RETRIES})`);
        const rawOutput = await fn(SYSTEM_PROMPT, userPrompt);
        const paper = parsePaperJson(rawOutput);
        logger.info(`Generation succeeded with ${name}`);
        return paper;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);

        // If AI SDK rejected image-like content, re-sanitize and retry with same provider
        if (isImageInputError(msg) && !errors.some((e) => e.includes('[sanitized]'))) {
          logger.warn(`${name}: Image/file references detected. Re-sanitizing and retrying.`);
          userPrompt = sanitizePrompt(userPrompt);
          try {
            const rawOutput = await fn(SYSTEM_PROMPT, userPrompt);
            const paper = parsePaperJson(rawOutput);
            logger.info(`Generation succeeded with ${name} after prompt sanitization`);
            return paper;
          } catch (retryErr) {
            const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
            logger.warn(`${name} still failed after sanitization: ${retryMsg}`);
            errors.push(`${name}[sanitized]: ${retryMsg}`);
            continue;
          }
        }

        if (error instanceof PaperParseError && !error.retryable) {
          logger.error(`${name} non-retryable error: ${msg}`);
          errors.push(`${name}: ${msg}`);
          break;
        }
        logger.warn(`${name} attempt ${attempt} failed: ${msg}`);
        recordFailure(name);
        errors.push(`${name}[${attempt}]: ${msg}`);
        if (attempt < MAX_RETRIES) {
          const delay = 1000 * attempt + Math.random() * 500;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw new Error(`All AI providers failed: ${errors.join(' | ')}`);
}

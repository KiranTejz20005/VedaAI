import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { SYSTEM_PROMPT, buildGenerationPrompt } from '../prompts/generation.prompt';
import { parsePaperJson, PaperParseError } from '../parsers/paper.parser';
import type { IAssignment } from '../models/Assignment.model';
import type { ValidatedPaper } from '../validators/paper.validator';
import { logger } from '../utils/logger';

const MAX_RETRIES = 3;

async function generateWithOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!env.OPENAI_API_KEY) throw new Error('OpenAI API key not configured');
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 4000,
  });
  return response.choices[0]?.message?.content ?? '';
}

async function generateWithAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) throw new Error('Anthropic API key not configured');
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}

async function generateWithGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new Error('Gemini API key not configured');
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const result = await model.generateContent(
    `${systemPrompt}\n\n${userPrompt}`
  );
  return result.response.text();
}

async function generateWithNvidia(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!env.NVIDIA_API_KEY) throw new Error('NVIDIA API key not configured');
  const client = new OpenAI({
    apiKey: env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });
  const response = await client.chat.completions.create({
    model: 'meta/llama-3.1-70b-instruct',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 4000,
  });
  return response.choices[0]?.message?.content ?? '';
}

type ProviderFn = (system: string, user: string) => Promise<string>;

function getProviderChain(): Array<{ name: string; fn: ProviderFn }> {
  const providers: Array<{ name: string; fn: ProviderFn; key: string | undefined }> = [
    { name: 'OpenAI', fn: generateWithOpenAI, key: env.OPENAI_API_KEY },
    { name: 'Anthropic', fn: generateWithAnthropic, key: env.ANTHROPIC_API_KEY },
    { name: 'Gemini', fn: generateWithGemini, key: env.GEMINI_API_KEY },
    { name: 'NVIDIA', fn: generateWithNvidia, key: env.NVIDIA_API_KEY },
  ];
  return providers
    .filter((p) => Boolean(p.key))
    .map(({ name, fn }) => ({ name, fn }));
}

export async function generatePaper(
  assignment: IAssignment,
  uploadedContent?: string
): Promise<ValidatedPaper> {
  const userPrompt = buildGenerationPrompt(assignment, uploadedContent);
  const providers = getProviderChain();

  if (providers.length === 0) {
    throw new Error('No AI provider configured. Add at least one API key to .env');
  }

  for (const { name, fn } of providers) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        logger.info(`Attempting generation with ${name} (attempt ${attempt}/${MAX_RETRIES})`);
        const rawOutput = await fn(SYSTEM_PROMPT, userPrompt);
        const paper = parsePaperJson(rawOutput);
        logger.info(`✅ Generation succeeded with ${name}`);
        return paper;
      } catch (error) {
        if (error instanceof PaperParseError && !error.retryable) {
          logger.error(`${name} produced non-retryable error, trying next provider`);
          break;
        }
        logger.warn(`${name} attempt ${attempt} failed:`, error);
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    logger.warn(`${name} exhausted all retries, falling back to next provider`);
  }

  throw new Error('All AI providers failed to generate a valid paper');
}

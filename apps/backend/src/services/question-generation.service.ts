import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

interface GeneratedQuestion {
  id: string;
  question_text: string;
  options: string[];
  answer: string;
  difficulty: string;
  bloomLevel: string;
  ai_confidence_score: number;
  hint?: string;
}

let nvidiaClient: OpenAI | null = null;
let groqClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;

function getNvidia(): OpenAI {
  if (!nvidiaClient) nvidiaClient = new OpenAI({ apiKey: env.NVIDIA_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1', timeout: 30000 });
  return nvidiaClient;
}

function getGroq(): OpenAI {
  if (!groqClient) groqClient = new OpenAI({ apiKey: env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1', timeout: 30000 });
  return groqClient;
}

function getAnthropic(): Anthropic {
  if (!anthropicClient) anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 30000 });
  return anthropicClient;
}

function pickProvider(): 'nvidia' | 'groq' | 'anthropic' | null {
  if (env.ANTHROPIC_API_KEY) return 'anthropic';
  if (env.NVIDIA_API_KEY) return 'nvidia';
  if (env.GROQ_API_KEY) return 'groq';
  return null;
}

const SYSTEM_PROMPT = `You are an expert assessment question generator. Generate a single high-quality question based on the given topic and subject. 

Rules:
- Question must be clear, specific, and test meaningful knowledge
- Include 4 plausible options (A, B, C, D)
- Mark the correct answer clearly
- Include a helpful, subtle hint (max 1 sentence) that guides the user without directly giving away the correct option
- Return ONLY valid JSON with NO markdown formatting
- Output format: {"question_text":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"...","hint":"..."}

The answer value must be exactly "A", "B", "C", or "D".`;

export class NoProviderError extends Error {
  constructor() { super('No AI provider configured. Set ANTHROPIC_API_KEY, NVIDIA_API_KEY, or GROQ_API_KEY.'); }
}

export class ImageRefError extends Error {
  constructor() { super('Uploaded content contained image references which were removed. Please use text-only content.'); }
}

function sanitizePrompt(text: string): string {
  let cleaned = text;
  const imagePatterns = [
    /\S*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\b/gi,
    /data:image\/[^;]+;base64[^\s"'()]+/gi,
    /!\[.*?\]\(.*?\)/g,
    /\[.*?\]\(.*?\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\)/g,
    /\(?\s*(?:see|refer|check|view|look at)\s*:?\s*[^)\n]*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\s*\)?/gi,
  ];
  for (const pattern of imagePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned;
}

export async function callAI(prompt: string, systemPrompt: string = SYSTEM_PROMPT): Promise<string> {
  const provider = pickProvider();
  if (!provider) throw new NoProviderError();

  const cleanPrompt = sanitizePrompt(prompt);
  if (cleanPrompt !== prompt) {
    const imageRefs = prompt.match(/\S*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\b/gi);
    if (imageRefs && imageRefs.length > 0) {
      throw new ImageRefError();
    }
  }

  if (provider === 'anthropic') {
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: cleanPrompt }],
    });
    const content = response.content[0];
    if (content?.type === 'text') return content.text;
    throw new Error('Unexpected Anthropic response format');
  }

  const client = provider === 'nvidia' ? getNvidia() : getGroq();
  const model = provider === 'nvidia' ? 'meta/llama-3.1-8b-instruct' : 'llama-3.3-70b-versatile';

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: cleanPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });
  return response.choices[0]?.message?.content ?? '';
}

function extractJson(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in AI response');
  return JSON.parse(jsonMatch[0]);
}

export async function generateSingleQuestion(params: {
  topic: string;
  subject: string;
  difficulty: string;
  bloomLevel: string;
  context?: string;
}): Promise<GeneratedQuestion> {
  const prompt = [
    `Topic: ${params.topic}`,
    `Subject: ${params.subject}`,
    `Difficulty: ${params.difficulty}`,
    `Bloom's Taxonomy Level: ${params.bloomLevel}`,
    params.context ? `Reference Context: ${params.context}` : '',
    '',
    'Generate one high-quality question. Return ONLY valid JSON.',
  ].filter(Boolean).join('\n');

  const raw = await callAI(prompt);
  const parsed = extractJson(raw);

  const options = (parsed.options as string[]) ?? ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'];
  const answer = (parsed.answer as string) ?? 'A';

  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question_text: (parsed.question_text as string) ?? `Question about ${params.topic}`,
    options,
    answer,
    difficulty: params.difficulty,
    bloomLevel: params.bloomLevel,
    ai_confidence_score: 0.85,
    hint: (parsed.hint as string) || undefined,
  };
}

export async function generateMultipleQuestions(params: {
  topic: string;
  subject: string;
  difficulty: string;
  bloomLevel: string;
  context?: string;
  count: number;
}): Promise<GeneratedQuestion[]> {
  const systemPrompt = `You are an expert assessment question generator. Generate exactly ${params.count} distinct, high-quality questions based on the given topic and subject.

Rules:
- All generated questions must be completely distinct and unique. No two questions should test the exact same concept or have similar phrasing.
- Ensure high-quality questions that test meaningful knowledge.
- For each question, include 4 plausible options (A, B, C, D).
- For each question, mark the correct answer clearly (must be exactly "A", "B", "C", or "D").
- For each question, include a helpful, subtle hint (max 1 sentence) that guides the user without directly giving away the correct option.
- Return ONLY valid JSON with NO markdown formatting.
- Output format must be a JSON object containing an array of questions, like this:
{
  "questions": [
    {"question_text":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"...","hint":"..."},
    ...
  ]
}`;

  const prompt = [
    `Topic: ${params.topic}`,
    `Subject: ${params.subject}`,
    `Difficulty: ${params.difficulty}`,
    `Bloom's Taxonomy Level: ${params.bloomLevel}`,
    params.context ? `Reference Context: ${params.context}` : '',
    '',
    `Generate exactly ${params.count} high-quality questions. Return ONLY valid JSON matching the specified format.`,
  ].filter(Boolean).join('\n');

  const raw = await callAI(prompt, systemPrompt);
  const parsed = extractJson(raw);
  const questionsList = (parsed.questions as any[]) ?? [];

  return questionsList.map((item, index) => {
    const options = (item.options as string[]) ?? ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'];
    const answer = (item.answer as string) ?? 'A';
    return {
      id: `q-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      question_text: (item.question_text as string) ?? `Question about ${params.topic}`,
      options,
      answer,
      difficulty: params.difficulty,
      bloomLevel: params.bloomLevel,
      ai_confidence_score: (item.ai_confidence_score as number) ?? 0.85,
      hint: (item.hint as string) || undefined,
    };
  });
}

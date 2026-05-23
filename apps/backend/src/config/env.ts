/**
 * Centralized environment variable validation using Zod.
 * Loads .env from the backend directory explicitly to avoid monorepo conflicts.
 * Fails fast at startup if any required variable is missing or malformed.
 */
import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env from the backend app directory explicitly.
// This avoids monorepo root .env conflicts when using tools like Turbopack.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ── MongoDB URI validator ─────────────────────────────────────────────────────
const mongoUriSchema = z
  .string()
  .min(1, 'MONGODB_URI is required')
  .refine(
    (uri) => uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
    'MONGODB_URI must start with mongodb:// or mongodb+srv://'
  )
  .refine(
    (uri) => !uri.includes('<') && !uri.includes('>'),
    'MONGODB_URI contains < or > angle brackets — remove them and use the raw password value'
  );

// ── Redis URL validator ───────────────────────────────────────────────────────
const redisUrlSchema = z
  .string()
  .min(1, 'REDIS_URL is required')
  .refine(
    (url) =>
      url.startsWith('redis://') ||
      url.startsWith('rediss://') ||
      url.startsWith('redis+tls://'),
    'REDIS_URL must start with redis://, rediss://, or redis+tls:// — not a CLI command'
  );

// ── Full env schema ───────────────────────────────────────────────────────────
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),

  // Database
  MONGODB_URI: mongoUriSchema,

  // Redis (general — used for caching, sessions)
  REDIS_URL: redisUrlSchema,
  // Redis for BullMQ (MUST be local Redis — Upstash kills BullMQ)
  // Upstash serverless Redis does NOT support blocking commands (BLPOP, etc.)
  // that BullMQ workers require. Using Upstash for BullMQ causes silent job
  // stalls, heartbeat failures, lock corruption, and infinite frontend polling.
  REDIS_BULLMQ_URL: z
    .string()
    .default('redis://localhost:6379')
    .refine(
      (url) => !url.includes('upstash'),
      'REDIS_BULLMQ_URL must NOT be an Upstash URL — Upstash does not support BullMQ blocking commands. Use a local Redis instance (redis://localhost:6379)'
    ),

  // AI Providers (all optional — system degrades gracefully without them)
  // IMPORTANT: .transform trims whitespace AND drops keys shorter than 5 chars
  OPENAI_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 5 ? v.trim() : undefined)),
  ANTHROPIC_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 5 ? v.trim() : undefined)),
  GEMINI_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 5 ? v.trim() : undefined)),
  NVIDIA_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 5 ? v.trim() : undefined)),
  GROQ_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 5 ? v.trim() : undefined)),

  // Security
  JWT_SECRET: z.string().min(16).default('veda-ai-dev-secret-change-in-production'),

  // CORS
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Upload
  MAX_FILE_SIZE_MB: z.string().default('10').transform(Number),
  UPLOAD_DIR: z.string().default('./uploads'),

  // Local development resource controls
  ENABLE_BACKGROUND_WORKERS: z
    .string()
    .default('true')
    .transform((value) => value.toLowerCase() !== 'false'),
  AI_WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(4).default(1),
  PDF_WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(2).default(1),
  QUEUE_SWEEP_INTERVAL_MS: z.coerce.number().int().min(30_000).default(120_000),
  STALL_MONITOR_INTERVAL_MS: z.coerce.number().int().min(60_000).default(300_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors;
  console.error('❌ Invalid environment variables:');
  for (const [key, messages] of Object.entries(errors)) {
    console.error(`  ${key}: ${messages?.join(', ')}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

// ── Warn if no AI provider is configured ─────────────────────────────────────
if (
  parsed.data.NODE_ENV !== 'test' &&
  !parsed.data.OPENAI_API_KEY &&
  !parsed.data.ANTHROPIC_API_KEY &&
  !parsed.data.GEMINI_API_KEY &&
  !parsed.data.NVIDIA_API_KEY &&
  !parsed.data.GROQ_API_KEY
) {
  console.warn(
    '⚠️  No AI provider API key configured. Assignment generation will fail. ' +
      'Set at least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, NVIDIA_API_KEY, GROQ_API_KEY'
  );
}

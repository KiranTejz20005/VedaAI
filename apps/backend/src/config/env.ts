import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env from multiple possible locations (works in dev, PM2, containerized)
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '.env'),
];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),

  // Database
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // Redis (general — caching, sessions, pub/sub)
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  // Redis for BullMQ — requires TCP-compatible Redis (Upstash TCP endpoint works, REST does not)
  REDIS_BULLMQ_URL: z.string().min(1, 'REDIS_BULLMQ_URL is required'),

  // AI Providers (at least one required for generation)
  OPENAI_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 5 ? v.trim() : undefined)),
  ANTHROPIC_API_KEY: z
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
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),

  // CORS — comma-separated list of allowed origins (no default, fails if unset in production)
  FRONTEND_URL: z.string().min(1, 'FRONTEND_URL is required (comma-separated)'),
  SOCKET_CORS_ORIGIN: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),

  // Upload / Storage
  STORAGE_TYPE: z.enum(['local', 's3', 'cloudinary']).default('local'),
  MAX_FILE_SIZE_MB: z.string().default('10').transform(Number),
  UPLOAD_DIR: z
    .string()
    .default('./uploads')
    .transform((v) => (v.startsWith('/') || v.startsWith('./') ? v : `./${v}`)),

  // Cloud storage credentials (optional, used when STORAGE_TYPE !== 'local')
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Worker configuration
  ENABLE_BACKGROUND_WORKERS: z
    .string()
    .default('true')
    .transform((value) => value.toLowerCase() !== 'false'),
  AI_WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(4).default(1),
  PDF_WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(2).default(1),
  // Render worker mode: 'web' = API only, 'worker' = workers only, 'both' = combined (dev only)
  RENDER_WORKER_MODE: z.enum(['web', 'worker', 'both']).default('both'),

  // Queue / Retry tuning
  QUEUE_SWEEP_INTERVAL_MS: z.coerce.number().int().min(30_000).default(120_000),
  STALL_MONITOR_INTERVAL_MS: z.coerce.number().int().min(60_000).default(300_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors;
  console.error(' FAILED TO START — Invalid or missing environment variables:');
  for (const [key, messages] of Object.entries(errors)) {
    console.error(`  ${key}: ${messages?.join(', ')}`);
  }
  if ((parsed.data as Record<string, string> | undefined)?.NODE_ENV === 'production') {
    console.error('Production environment validation failed. Fix env vars and redeploy.');
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

// ── Production-specific checks ──
if (parsed.data.NODE_ENV === 'production') {
  if (parsed.data.JWT_SECRET === 'veda-ai-dev-secret-change-in-production') {
    console.error('CRITICAL: JWT_SECRET is still set to the development default. Set a strong random secret.');
    process.exit(1);
  }

  const urls = parsed.data.FRONTEND_URL.split(',').map((s) => s.trim()).filter(Boolean);
  const hasLocalhost = urls.some((url) => url.includes('localhost') || url.includes('127.0.0.1'));
  if (urls.length === 1 && hasLocalhost) {
    console.error('CRITICAL: FRONTEND_URL is set to localhost in production mode. Set the real frontend domain.');
    process.exit(1);
  }
}

// ── Warn if no AI provider is configured ──
if (
  parsed.data.NODE_ENV !== 'test' &&
  !parsed.data.OPENAI_API_KEY &&
  !parsed.data.ANTHROPIC_API_KEY &&
  !parsed.data.NVIDIA_API_KEY &&
  !parsed.data.GROQ_API_KEY
) {
  console.warn(
    '⚠️  No AI provider API key configured. Assignment generation will fail. ' +
    'Set at least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, NVIDIA_API_KEY, GROQ_API_KEY'
  );
}

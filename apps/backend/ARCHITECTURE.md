# VedaAI Backend Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Redis Topology](#redis-topology)
3. [BullMQ Queue Architecture](#bullmq-queue-architecture)
4. [AI Provider Orchestration](#ai-provider-orchestration)
5. [Worker Lifecycle](#worker-lifecycle)
6. [Assignment Generation Pipeline](#assignment-generation-pipeline)
7. [WebSocket Flow](#websocket-flow)
8. [Health Monitoring](#health-monitoring)
9. [Failure Recovery](#failure-recovery)
10. [Development Setup](#development-setup)

---

## System Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Frontend   │────▶│  Express API │────▶│   MongoDB   │
│  (Next.js)  │◀────│  (Port 5000) │     │  (Atlas)    │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │                      
                    ┌──────┴───────┐             
                    │  Socket.IO   │             
                    │  (WebSocket) │             
                    └──────────────┘             
                           │                      
                    ┌──────┴───────┐             
                    │   BullMQ     │             
                    │   Workers    │             
                    └──────┬───────┘             
                           │                      
                    ┌──────┴───────┐             
                    │    Redis     │             
                    │  (Upstash*)  │             
                    └──────────────┘             
```

*BullMQ requires local Redis for production stability. See [Redis Topology](#redis-topology).

## Redis Topology

### Two-Connection Architecture

The system uses **two separate Redis connections** with different purposes:

| Connection | Env Variable | Purpose | Requirements |
|---|---|---|---|
| `getRedisClient()` | `REDIS_URL` | Caching, sessions, general purpose | Supports Upstash |
| `getBullRedisClient()` | `REDIS_BULLMQ_URL` | BullMQ queues & workers | **Must be local Redis** |

### Why BullMQ Requires Local Redis

BullMQ relies on blocking Redis commands (`BRPOP`) for queue polling, persistent worker locks, and stalled job detection. **Upstash does not support blocking commands.** Using Upstash for BullMQ causes:

- Stalled job detection failures
- Worker lock expiration during long AI generation
- Phantom retries and duplicate processing
- Intermittent queue hangs
- Jobs silently dropped after worker restart

### Migration Path to Local Redis

1. Install local Redis (Docker or native):
   ```bash
   docker compose up -d redis   # Already configured in docker-compose.yml
   ```
2. Update `.env`:
   ```env
   REDIS_BULLMQ_URL=redis://localhost:6379
   ```
3. The `getBullRedisClient()` auto-detects local Redis and uses it.

## BullMQ Queue Architecture

### Queue Configuration

```typescript
// generation.queue.ts
new Queue('generation', {
  connection: getBullRedisClient(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});
```

### Worker Configuration

```typescript
// aiGeneration.worker.ts
new Worker('generation', processor, {
  connection: getBullRedisClient(),
  concurrency: 2,              // Max 2 concurrent AI generation jobs
  limiter: { max: 5, duration: 60000 },  // Rate limit: 5 jobs/min
  lockDuration: 120_000,       // MUST match max AI generation time (120s)
});
```

**Critical: `lockDuration`** — The default BullMQ lock is 30s. AI generation takes up to 120s. Without extending the lock, BullMQ's stalled-job detector marks the job as stalled and requeues it while the worker is still processing. Set `lockDuration` to match `GENERATION_TIMEOUT_MS`.

### Queue State Transitions

```
                    ┌──────────┐
                    │  Draft   │ (MongoDB only)
                    └────┬─────┘
                         │ POST /api/assignments
                         ▼
                    ┌──────────┐
                    │  Queued  │─────▶ Queue Timeout Watchdog (2 min)
                    └────┬─────┘           │
                         │ Worker picks up  │
                         ▼                  ▼
                    ┌──────────┐     ┌──────────┐
                    │  Active  │     │  Failed  │
                    └────┬─────┘     └──────────┘
                         │ Complete
                         ▼
                    ┌──────────┐
                    │ Completed│
                    └──────────┘
```

### Stalled Job Detection

BullMQ v5+ auto-creates a QueueScheduler internally. The scheduler:
- Monitors active jobs every 30s (configurable via `stalledInterval`)
- If a job's lock is not renewed before `lockDuration` expires, marks it as stalled
- Requeues stalled jobs up to `maxStalledCount` (default: 1) times
- After exceeding max stalled count, moves job to failed

**To prevent stalls during AI generation:**
- `lockDuration` must exceed the maximum AI provider timeout (90s) + padding (30s)
- The worker process must not be killed during job processing
- ts-node-dev restart kills active jobs — use `node dist/app.js` for production

## AI Provider Orchestration

### Provider Chain

```
NVIDIA (Llama 3.1 70B)  ─── Primary (no image detection issues)
  └── On failure ──▶ OpenAI (GPT-4o)
                      └── On failure ──▶ Anthropic (Claude 3.5 Sonnet)
                                          └── On failure ──▶ Gemini (1.5 Pro)
```

### Circuit Breaker Pattern

Each provider has a circuit breaker that opens after 3 consecutive failures:
- Open duration: 60 seconds
- After 60s, resets to half-open (allows one request)
- If that request succeeds, circuit closes
- On failure, circuit reopens for another 60s

### Image-Sanitization Fallback

When an AI provider throws a "Cannot read 'image.png'" error (SDK detecting file paths in text content):
1. Log the error with `[sanitized]` tag
2. Re-sanitize the prompt with aggressive regex patterns
3. Retry with the **same provider** using the sanitized prompt
4. If retry also fails, move to next provider

### Retry Strategy

- Per-provider retries: 2 (configurable via `MAX_RETRIES`)
- Retry delay: exponential with jitter (`1000 * attempt + random(500)ms`)
- BullMQ job retries: 2 (queue-level)
- Total possible attempts: 2 (BullMQ) × 4 (providers) × 2 (per-provider) = 16

## Worker Lifecycle

### Startup Sequence

```
1. MongoDB connection established
2. Socket.IO server initialized
3. BullMQ Workers created (aiGeneration, pdf)
   └── getBullRedisClient() connects to Redis
4. Queue timeout watchdog starts (30s interval)
5. Express HTTP server starts listening
```

### Graceful Shutdown

On `SIGTERM` or `SIGINT`:

```
1. Stop socket server (new connections rejected)
2. Drain workers (wait for active jobs, 15s timeout)
3. Disconnect MongoDB
4. Close Redis connections
5. Close HTTP server
6. Force exit after 10s timeout
```

### Worker Crash Recovery

When a worker crashes during job processing:
1. BullMQ detects the crash when `lockDuration` expires (30s default, 120s configured)
2. QueueScheduler marks the job as stalled
3. Job is retried (up to `maxStalledCount` times)
4. If all retries exhausted, job moves to failed
5. Worker error handler updates MongoDB: Assignment→failed, GenerationJob→failed
6. WebSocket emits `generation:failed` to frontend

## Assignment Generation Pipeline

### Full Trace (STEP 0–14)

```
STEP 0  │ Validate GenerationJob record exists
STEP 1  │ Emit WebSocket progress: queued (0%)
STEP 2  │ Update GenerationJob status: processing (5%)
STEP 3  │ Fetch Assignment from MongoDB
STEP 4  │ Update Assignment status: generating
STEP 5  │ Extract & sanitize uploaded content (PDF/TXT files)
STEP 6  │ Parse typeBreakdown from assignment
STEP 7  │ AI generation (CRITICAL — 120s timeout)
        │   ├── NVIDIA ──▶ success ──▶ parse JSON
        │   ├── OpenAI  ──▶ success ──▶ parse JSON
        │   ├── Anthropic──▶ success ──▶ parse JSON
        │   └── Gemini  ──▶ success ──▶ parse JSON
STEP 8  │ Emit WebSocket progress: parsing (70%)
STEP 9  │ Save GeneratedPaper to MongoDB
STEP 10 │ Emit WebSocket progress: saving (85%)
STEP 11 │ Update Assignment status: completed
STEP 12 │ Update GenerationJob: completed (100%)
STEP 13 │ Emit WebSocket: generation:completed
STEP 14 │ Enqueue PDF generation job
```

### Timing Configuration

| Component | Timeout | Location |
|---|---|---|
| BullMQ job lock | 120s | `lockDuration` in worker config |
| AI provider call | 90s | `AI_TIMEOUT_MS` in ai.service.ts |
| Worker generation | 120s | `GENERATION_TIMEOUT_MS` in worker |
| Queue idle timeout | 120s | `QUEUE_TIMEOUT_MS` in app.ts |
| Queue sweep interval | 30s | `QUEUE_SWEEP_INTERVAL_MS` in app.ts |

## WebSocket Flow

### Events

| Event | Direction | Payload | Trigger |
|---|---|---|---|
| `generation:queued` | Server→Client | `{ assignmentId, jobId, position }` | Job enqueued |
| `generation:progress` | Server→Client | `{ assignmentId, progress, stage, message }` | Worker progress |
| `generation:completed` | Server→Client | `{ assignmentId, paperId }` | Paper saved |
| `generation:failed` | Server→Client | `{ assignmentId, error, retryable }` | All retries exhausted |
| `subscribe:assignment` | Client→Server | `{ assignmentId }` | Join room |
| `unsubscribe:assignment` | Client→Server | `{ assignmentId }` | Leave room |

### Room-Based Delivery

Clients join assignment-specific rooms:
```typescript
socket.join(`assignment:${assignmentId}`);
```
Emissions target specific rooms:
```typescript
io.to(`assignment:${assignmentId}`).emit(event, payload);
```

## Health Monitoring

### Endpoint: `GET /health`

```json
{
  "status": "ok",
  "timestamp": "2026-05-22T07:06:10.396Z",
  "env": "development",
  "uptime": 25.24,
  "services": {
    "database": "connected",
    "redis": "connected",
    "bullmqRedis": "connected",
    "workers": { "ai": true, "pdf": true },
    "queues": {
      "generation": { "waiting": 0, "active": 0, "failed": 0, "completed": 0 },
      "pdf": { "waiting": 0, "active": 0, "failed": 0, "completed": 0 }
    },
    "aiProviders": { "openai": "configured", "nvidia": "configured" }
  }
}
```

### Queue Timeout Watchdog

Runs every 30 seconds. Finds GenerationJobs stuck in `queued` status for >2 minutes:
- Updates Assignment → `failed`
- Updates GenerationJob → `failed` with error message
- Emits `generation:failed` via WebSocket
- Prevents jobs from being stuck indefinitely

## Failure Recovery

### Known Failure Modes

| Symptom | Root Cause | Fix |
|---|---|---|
| Job stuck in `queued`, never processed | BullMQ duplicate `jobId` | Use unique `jobId` with `Date.now()` suffix |
| Job stuck in `active`, never completes | Worker crash during processing | Set `lockDuration` to match max AI time |
| "Generation timed out while waiting in queue" | BullMQ silently rejected duplicate job | Timestamp suffix in `jobId` |
| "Cannot read 'image.png'" | AI SDK detects file path in text | Sanitize prompt + explicit text blocks |
| "All AI providers failed" | All providers returned invalid JSON | Check provider API keys + rate limits |
| Worker won't start after restart | Upstash doesn't support blocking commands | Use local Redis for BullMQ |

### Recovery Steps

1. **Check health endpoint**: `GET /health` — check queue metrics
2. **Check MongoDB**: Look at Assignment and GenerationJob documents
3. **Check BullMQ**: `queue.getFailed()` for failed jobs with reasons
4. **Reset failed assignment**: Set Assignment status to `draft`, delete stale GenerationJobs
5. **Regenerate**: POST `/api/assignments/:id/generate`

## Development Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local preferred; Upstash works with limitations)
- AI Provider API keys (NVIDIA, OpenAI, Anthropic, Gemini)

### Quick Start

```bash
# 1. Install dependencies
cd vedaai
npm install

# 2. Start local services
docker compose up -d    # MongoDB + Redis

# 3. Configure environment
cp apps/backend/.env.example apps/backend/.env
# Edit .env with your API keys

# 4. Start development server
npm run dev             # Starts both frontend + backend

# 5. Build for production
npm run build
cd apps/backend && node dist/app.js
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `development`, `production`, or `test` |
| `PORT` | No | `5000` | Backend HTTP port |
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `REDIS_URL` | Yes | — | General Redis (supports Upstash) |
| `REDIS_BULLMQ_URL` | No | `redis://localhost:6379` | BullMQ Redis (must be local) |
| `OPENAI_API_KEY` | No | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | No | — | Anthropic API key |
| `GEMINI_API_KEY` | No | — | Google Gemini API key |
| `NVIDIA_API_KEY` | No | — | NVIDIA API key |
| `JWT_SECRET` | No | default | Secret for JWT tokens |
| `FRONTEND_URL` | No | `http://localhost:3000` | CORS origin |

### Testing

```bash
# Backend tests
cd apps/backend && npm test

# Frontend tests
cd apps/frontend && npm test

# Connection validation
cd apps/backend && npm run test:connections
```

### Debugging

```bash
# Watch backend logs
cd apps/backend && npm run dev

# Specific trace filtering (PowerShell)
npm run dev | Select-String "\[TRACE\]|\[STEP\]|\[AI:\]|\[WORKER\]"

# Check queue state
curl http://localhost:5000/health

# Reset stuck assignment
# 1. Set status to 'draft' in MongoDB
# 2. Delete stale GenerationJob documents
# 3. POST /api/assignments/:id/generate
```

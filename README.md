# VedaAI — AI-Powered Assessment Creator

VedaAI is a full-stack SaaS platform that helps educators create structured, validated exam papers using AI. Teachers upload syllabus materials (PDF/TXT), configure question types and difficulty, and receive a printable paper with answer keys and PDF export—tracked in real time over WebSockets.

This document is the **canonical end-to-end reference** for the repository: architecture, setup, configuration, APIs, deployment, and operations.

---

## Table of contents

1. [Live environments](#live-environments)
2. [Architecture](#architecture)
3. [Technology stack](#technology-stack)
4. [Repository layout](#repository-layout)
5. [Prerequisites](#prerequisites)
6. [Quick start (local)](#quick-start-local)
7. [Environment variables](#environment-variables)
8. [Monorepo scripts](#monorepo-scripts)
9. [Backend (API + workers)](#backend-api--workers)
10. [Frontend (Next.js)](#frontend-nextjs)
11. [Generation pipeline](#generation-pipeline)
12. [REST API reference](#rest-api-reference)
13. [WebSocket events](#websocket-events)
14. [Data models](#data-models)
15. [File uploads & storage](#file-uploads--storage)
16. [AI providers](#ai-providers)
17. [Security](#security)
18. [Testing](#testing)
19. [Deployment](#deployment)
20. [Troubleshooting](#troubleshooting)
21. [Additional documentation](#additional-documentation)

---

## Live environments

| Component | URL | Notes |
|-----------|-----|--------|
| **Frontend (production)** | https://vedaai-ed.vercel.app | Next.js on Vercel |
| **Backend (test/staging API)** | https://vedaai-test.onrender.com | Express + Socket.IO on Render |
| **Health check** | https://vedaai-test.onrender.com/health | Used by Render `healthCheckPath` |
| **Local frontend** | http://localhost:3000 | `npm run dev` in workspace |
| **Local backend** | http://localhost:5000 | Default `PORT` |

The frontend defaults to the Render test API when env vars are unset (`apps/frontend/src/config/public-env.ts`). Vercel rewrites `/api/*` and `/socket.io/*` to the backend when using same-origin URLs (`apps/frontend/vercel.json`).

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Browser (Teacher)                                 │
│  Next.js 16 App Router · React 19 · Zustand · Socket.IO Client · Axios   │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ HTTPS REST  +  WebSocket (Socket.IO)
┌───────────────────────────────▼──────────────────────────────────────────┐
│                    Express API (apps/backend)                               │
│  Routes → Controllers → Services → Mongoose Models                          │
│  Socket.IO server (rooms per assignment)                                    │
│  Global rate limits · Helmet · CORS · Multer uploads                        │
└───────────────┬──────────────────────────────┬─────────────────────────────┘
                │ BullMQ (blocking Redis)       │ MongoDB
┌───────────────▼──────────────┐   ┌───────────▼────────────────────────────┐
│  Redis                        │   │  MongoDB (Atlas or local Docker)        │
│  · Job queues (generation,    │   │  · assignments                          │
│    pdf)                       │   │  · generation_jobs                      │
│  · Optional general cache     │   │  · generated_papers                     │
└───────────────┬──────────────┘   └──────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────────────┐
│  Background workers (same codebase, separate Render worker service)         │
│  · aiGeneration.worker — extract content, AI batches, validate, persist    │
│  · pdf.worker — Puppeteer + Chromium → A4 PDF                             │
│  Provider fallback: NVIDIA → Groq → Anthropic (circuit breaker)            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Request flow (create assignment):**

1. Teacher submits the multi-step form → `POST /api/assignments` (multipart).
2. Assignment saved; files stored; `GenerationJob` created; BullMQ job enqueued.
3. Socket emits `generation:queued` to room `assignment:{id}`.
4. Worker runs pipeline (see [Generation pipeline](#generation-pipeline)); progress events stream to the client.
5. On success: paper persisted, `generation:completed`, PDF job enqueued, `generation:pdf_ready`.
6. Frontend opens the paper view; user downloads PDF.

---

## Technology stack

| Layer | Technologies |
|-------|----------------|
| **Monorepo** | npm workspaces (`apps/frontend`, `apps/backend`) |
| **Frontend** | Next.js 16.2, React 19, TypeScript 5, Tailwind CSS 4, Framer Motion, Zustand, react-hook-form, Zod, axios, socket.io-client, react-hot-toast |
| **Backend** | Node.js 20+, Express 4, TypeScript 5, Mongoose 8, BullMQ 5, Socket.IO 4, Zod, Winston, Helmet, Multer |
| **AI** | NVIDIA API (Llama), Groq (Llama 3.3), Anthropic (Claude 3.5 Sonnet) |
| **PDF** | puppeteer-core, @sparticuz/chromium |
| **Data** | MongoDB 7, Redis 7 (must support BullMQ blocking commands) |
| **Deploy** | Vercel (frontend), Render (API + worker), Docker Compose (local DB/Redis) |

---

## Repository layout

```
VedaAI/                          # Repository root (this README)
├── package.json                 # Workspace root scripts (dev, build, test)
├── package-lock.json
├── docker-compose.yml           # Local MongoDB :27017 + Redis :6379
├── render.yaml                  # Render Blueprint: vedaai-api + vedaai-worker
├── start-web.sh                 # Render web: node apps/backend/dist/app.js
├── start-worker.sh              # Render worker: same binary, worker mode
├── README.md                    # ← You are here (canonical docs)
├── VedaAI_README.md             # Legacy extended notes (may be outdated)
│
└── apps/
    ├── backend/                 # Express API + BullMQ workers
    │   ├── src/
    │   │   ├── app.ts           # Entry: HTTP server, Socket.IO, workers, monitors
    │   │   ├── config/          # env.ts, db.ts, redis.ts
    │   │   ├── routes/          # assignment, paper, health sub-routes
    │   │   ├── controllers/
    │   │   ├── services/        # ai/, pdf, assignment, paper, storage
    │   │   ├── workers/         # aiGeneration.worker.ts, pdf.worker.ts
    │   │   ├── queues/          # generation.queue.ts, pdf.queue.ts
    │   │   ├── models/          # Assignment, GenerationJob, GeneratedPaper
    │   │   ├── sockets/         # socket.server.ts
    │   │   ├── validators/      # Zod request schemas
    │   │   ├── prompts/         # AI prompt builders
    │   │   ├── parsers/         # AI JSON → paper structure
    │   │   └── __tests__/       # Vitest unit/integration tests
    │   ├── .env.example
    │   ├── ARCHITECTURE.md      # Backend-focused deep dive
    │   └── BULLMQ-LOCAL-REDIS-SETUP.md
    │
    └── frontend/                # Next.js App Router UI
        ├── src/
        │   ├── app/             # Routes (dashboard, create, assignment detail, paper)
        │   ├── components/      # layout, generation UI, ui primitives
        │   ├── hooks/           # useAssignments, useSocket, useAssignmentPhase
        │   ├── store/           # Zustand: generation, sidebar
        │   ├── services/        # assignment.service, paper.service
        │   ├── lib/api.ts       # Axios client (dynamic base URL)
        │   ├── sockets/         # socket.client.ts
        │   ├── config/public-env.ts
        │   └── utils/url.ts
        ├── vercel.json          # API/socket rewrites to Render
        ├── next.config.ts
        ├── .env.local.example
        └── gan-harness/         # UI spec/rubric for design iterations
```

There is **no** `packages/` directory—only two workspace apps.

---

## Prerequisites

| Requirement | Version / notes |
|-------------|-----------------|
| **Node.js** | 20 LTS or newer |
| **npm** | 9+ (comes with Node) |
| **Docker Desktop** | For local MongoDB + Redis (recommended) |
| **AI API key** | At least one of: `NVIDIA_API_KEY`, `GROQ_API_KEY`, `ANTHROPIC_API_KEY` |
| **OS** | Windows, macOS, or Linux (PDF worker needs Chromium-compatible environment) |

**Redis warning:** Upstash *serverless* Redis does **not** support BullMQ blocking commands (`BLPOP`). Use Docker Redis locally or a full Redis instance (Render Redis, Redis Cloud, self-hosted).

---

## Quick start (local)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd VedaAI
npm install
```

Installs dependencies for the root workspace, `apps/backend`, and `apps/frontend`.

### 2. Start MongoDB and Redis

```bash
docker compose up -d
```

| Service | Port | Container name |
|---------|------|----------------|
| MongoDB | 27017 | `vedaai-mongodb` |
| Redis | 6379 | `vedaai-redis` |

Database name: `vedaai` (see `docker-compose.yml`).

### 3. Configure backend

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env` at minimum:

```env
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
REDIS_BULLMQ_URL=redis://localhost:6379
JWT_SECRET=your-local-dev-secret-min-16-chars
FRONTEND_URL=http://localhost:3000
NVIDIA_API_KEY=nvapi-...   # and/or GROQ_API_KEY, ANTHROPIC_API_KEY
ENABLE_BACKGROUND_WORKERS=true
```

Verify connections:

```bash
npm run test:connections --workspace=apps/backend
```

### 4. Configure frontend

```bash
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

**Option A — local backend:**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

**Option B — hosted test API (no local backend):**

```env
NEXT_PUBLIC_API_URL=https://vedaai-test.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://vedaai-test.onrender.com
```

Restart the dev server after changing env files.

### 5. Run the application

```bash
# Backend + frontend together
npm run dev

# Or: Docker services + both apps
npm run dev:all

# Or separately:
npm run dev:services              # docker compose only
npm run dev --workspace=apps/backend   # http://localhost:5000
npm run dev --workspace=apps/frontend  # http://localhost:3000
```

### 6. Smoke test

```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/health/providers
```

Open http://localhost:3000 → **Assignments** → **Create Assignment**.

---

## Environment variables

### Backend (`apps/backend/.env`)

Validated at startup in `apps/backend/src/config/env.ts`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | `development` \| `production` \| `test` |
| `PORT` | No | `5000` | HTTP + Socket.IO port |
| `MONGODB_URI` | **Yes** | — | `mongodb://` or `mongodb+srv://` (no `<>` around password) |
| `REDIS_URL` | **Yes** | — | General Redis URL |
| `REDIS_BULLMQ_URL` | **Yes** | — | BullMQ Redis (blocking commands) |
| `JWT_SECRET` | **Yes** | — | Min 16 characters; used for future auth hooks |
| `FRONTEND_URL` | **Yes** | — | Comma-separated CORS origins |
| `SOCKET_CORS_ORIGIN` | No | — | Override Socket.IO CORS (optional) |
| `ANTHROPIC_API_KEY` | No* | — | Fallback AI provider |
| `NVIDIA_API_KEY` | No* | — | Primary AI provider |
| `GROQ_API_KEY` | No* | — | Primary AI provider |
| `OPENAI_API_KEY` | No | — | In schema; **not used** in current provider chain |
| `STORAGE_TYPE` | No | `local` | `local` \| `s3` \| `cloudinary` |
| `UPLOAD_DIR` | No | `./uploads` | Local upload directory |
| `MAX_FILE_SIZE_MB` | No | `10` | Per-file upload limit |
| `ENABLE_BACKGROUND_WORKERS` | No | `true` | Set `false` to run API-only locally |
| `RENDER_WORKER_MODE` | No | `both` | `web` \| `worker` \| `both` (Render split services) |
| `AI_WORKER_CONCURRENCY` | No | `1` | 1–4 parallel AI jobs |
| `PDF_WORKER_CONCURRENCY` | No | `1` | 1–2 parallel PDF jobs |
| `QUEUE_SWEEP_INTERVAL_MS` | No | `120000` | Stale queued-job sweep |
| `STALL_MONITOR_INTERVAL_MS` | No | `300000` | Stuck in-progress job monitor |
| `S3_*` / `CLOUDINARY_*` | If using cloud storage | — | See `.env.example` |

\*At least one AI provider key must be configured for generation to work.

### Frontend (`apps/frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | API origin **without** `/api` suffix. Default: `https://vedaai-test.onrender.com` |
| `NEXT_PUBLIC_SOCKET_URL` | No | Socket.IO origin. Defaults to API URL |
| `NEXT_PUBLIC_API_DEBUG` | No | Set `true` to log API requests in production |

**Important:** Next.js only inlines `NEXT_PUBLIC_*` when accessed literally (see `src/config/public-env.ts`). After changes, restart `npm run dev`.

`apps/frontend/next.config.ts` also sets default env fallbacks for production builds.

---

## Monorepo scripts

Run from repository root (`VedaAI/`):

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Backend + frontend concurrently |
| `dev:services` | `npm run dev:services` | `docker compose up mongodb redis` |
| `dev:all` | `npm run dev:all` | Docker + backend + frontend |
| `build` | `npm run build` | Build backend (`tsc`) then frontend (`next build`) |
| `lint` | `npm run lint` | ESLint both workspaces |
| `test` | `npm run test` | Backend Vitest + frontend placeholder |

---

## Backend (API + workers)

### Entry point

| Mode | File |
|------|------|
| Development | `apps/backend/src/app.ts` (ts-node-dev) |
| Production | `apps/backend/dist/app.js` |

### Workspace scripts

```bash
cd apps/backend
npm run dev              # Hot reload, port 5000
npm run build            # Compile to dist/
npm run start            # node dist/app.js
npm test                 # Vitest
npm run test:watch
npm run test:connections # Mongo + Redis ping
```

### Layered structure

| Folder | Responsibility |
|--------|----------------|
| `routes/` | HTTP route definitions, rate limits on generate |
| `controllers/` | Parse request, call services, send response |
| `services/` | Business logic (assignments, papers, AI, PDF, storage) |
| `models/` | Mongoose schemas and indexes |
| `workers/` | BullMQ processors |
| `queues/` | Queue definitions, retry/backoff |
| `sockets/` | Socket.IO auth, rooms, event emitters |
| `validators/` | Zod schemas for API input |
| `prompts/` | System/user prompts for AI |
| `parsers/` | Normalize and validate AI JSON output |

### BullMQ queues

| Queue name | Worker file | Job | Default concurrency |
|------------|-------------|-----|---------------------|
| `generation` | `workers/aiGeneration.worker.ts` | AI paper generation | `AI_WORKER_CONCURRENCY` (1) |
| `pdf` | `workers/pdf.worker.ts` | `generate-pdf` | `PDF_WORKER_CONCURRENCY` (1) |

**Retries:** generation — 2 attempts, exponential backoff 5s; PDF — 2 attempts, 3s backoff.

**Render split:** Web service runs with `RENDER_WORKER_MODE=web`; worker service with `RENDER_WORKER_MODE=worker`. Both need `ENABLE_BACKGROUND_WORKERS=true` and shared Redis/MongoDB/upload disk.

### Watchdogs (in `app.ts`)

| Monitor | Default interval | Behavior |
|---------|------------------|----------|
| Queue sweep | 120s | Jobs stuck in `queued` > 2 min → failed + socket event |
| Stall monitor | 300s | Jobs in progress > 10 min → failed + socket event |

---

## Frontend (Next.js)

### Workspace scripts

```bash
cd apps/frontend
npm run dev      # http://localhost:3000 (--webpack)
npm run build
npm run start    # Production server
npm run lint
```

### App routes

| Route | File | Status |
|-------|------|--------|
| `/` | `src/app/page.tsx` | Marketing / landing |
| `/dashboard` | `src/app/dashboard/page.tsx` | Assignment list (live API) |
| `/assignments/create` | `src/app/assignments/create/page.tsx` | Multi-step create + upload |
| `/assignments/[id]` | `src/app/assignments/[id]/page.tsx` | Generation progress / status |
| `/assignments/[id]/paper` | `src/app/assignments/[id]/paper/page.tsx` | View paper + download PDF |
| `/groups` | `src/app/groups/page.tsx` | UI mock (no backend) |
| `/library` | `src/app/library/page.tsx` | UI mock |
| `/toolkit` | `src/app/toolkit/page.tsx` | UI mock |
| `/settings` | `src/app/settings/page.tsx` | UI mock |

### Key client modules

| Path | Purpose |
|------|---------|
| `src/lib/api.ts` | Axios instance; `baseURL = {origin}/api` per request |
| `src/utils/url.ts` | Resolve API/socket origin from env |
| `src/sockets/socket.client.ts` | Socket.IO singleton, reconnect handling |
| `src/store/generation.store.ts` | Generation stage, progress, errors |
| `src/hooks/useAssignments.ts` | Paginated assignment list |
| `src/hooks/useSocket.ts` | Subscribe to assignment room, map events to store |
| `src/components/generation/` | Full-screen generation overlay, pipeline, success/error |

### UI layout

- **Sidebar** — navigation, create button, assignment count badge.
- **Top bar** — page context (desktop).
- **Mobile bottom nav** — includes center create FAB on small screens.
- **Dashboard FAB** — fixed bottom-center “Create Assignment” on desktop (`dashboard-fab-v3`).

Generation UI is portaled to `document.body` to avoid layout/hydration issues inside `page-container`.

---

## Generation pipeline

### Assignment statuses

`draft` → `queued` → `generating` → `completed` | `failed` | `partially_generated`

### Socket stages (`GenerationStage`)

Typical progression:

1. `queued`
2. `extracting_content`
3. `topic_preprocessing`
4. `generation_planning`
5. `batch_generating`
6. (`provider_retry` / `validation_retry` / `recovering_batches` as needed)
7. `validating`
8. `answer_key_generating`
9. `pdf_composing`
10. `persisting`
11. `pdf-generating`
12. `completed` or `failed`

Frontend maps these to **5 visual phases** in `src/constants/generationPhases.ts` (`GenerationPipeline.tsx`).

### Worker steps (summary)

`aiGeneration.worker.ts`:

1. Lock job; validate `GenerationJob`.
2. Load assignment; set status `generating`.
3. Extract text from uploaded PDF/TXT.
4. `generatePaper()` — batched AI calls with provider fallback.
5. `generateAnswersForPaper()` — answer key.
6. Validate structure; quality gate (`complete` / `partial_success`).
7. Persist `GeneratedPaper`; update assignment status.
8. Emit `generation:completed` or `generation:failed`.
9. Enqueue PDF job → `pdf.worker` → Puppeteer → `generation:pdf_ready`.

### Frontend UX flow

1. Create assignment → redirect to `/assignments/[id]`.
2. Auto-queue generation; show full-screen `GenerationScreen`.
3. Live progress via Socket.IO (+ polling fallback every 8s).
4. On complete → redirect to `/assignments/[id]/paper` (or success view first).

---

## REST API reference

Base URL: `{ORIGIN}/api`  
Legacy aliases: `/api/v1/...` mirrors `/api/...`.

### Root & health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Service info JSON |
| `GET` | `/health` | Bootstrap health (DB/Redis phase) — **Render health check** |
| `GET` | `/api/health/redis` | Redis + BullMQ Redis status |
| `GET` | `/api/health/queue` | Active/stalled AI job counts |
| `GET` | `/api/health/providers` | Count of configured AI keys |

### Assignments

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/assignments` | List assignments (`page`, `limit`, optional `status`) |
| `POST` | `/api/assignments` | Create + enqueue generation (multipart) |
| `GET` | `/api/assignments/:id` | Get assignment + generation state |
| `DELETE` | `/api/assignments/:id` | Delete assignment |
| `POST` | `/api/assignments/:id/generate` | Re-trigger generation (rate limit: **15/hour**) |

**Global API rate limit:** 500 requests / 15 minutes per IP.

### Papers

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/papers/:assignmentId` | Get generated paper for assignment |
| `GET` | `/api/papers/job/:assignmentId` | Job status (polling fallback) |
| `GET` | `/api/papers/download/:filename` | Download generated PDF |

### Create assignment (multipart)

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | Required |
| `subject` | string | Required |
| `description` | string | Optional |
| `dueDate` | ISO date string | Required |
| `duration` | number | Minutes |
| `totalMarks` | number | |
| `questionConfig` | JSON string | Types, count, difficulty split |
| `typeBreakdown` | JSON string | Optional per-type counts |
| `additionalInstructions` | string | Optional |
| `files` | files | PDF/TXT, max 10 files, size limit from `MAX_FILE_SIZE_MB` |

Example `questionConfig`:

```json
{
  "types": ["mcq", "short-answer"],
  "count": 10,
  "difficulty": { "easy": 34, "medium": 33, "hard": 33 }
}
```

---

## WebSocket events

Connect to the same origin as `NEXT_PUBLIC_SOCKET_URL` (path `/socket.io`).

### Client → server

```typescript
socket.emit('subscribe:assignment', { assignmentId: string });
socket.emit('unsubscribe:assignment', { assignmentId: string });
```

Room name: `assignment:{assignmentId}` (MongoDB ObjectId).

### Server → client

| Event | When | Key payload fields |
|-------|------|-------------------|
| `generation:queued` | Job enqueued | `assignmentId`, `jobId`, `jobRecordId`, `generationSeq`, `position`, `version`, `ts` |
| `generation:processing` | Legacy/compat | Same family as progress |
| `generation:progress` | Stage update | `progress`, `stage`, `message`, versioning fields |
| `generation:completed` | Paper saved | `paperId`, `partial`, counts |
| `generation:failed` | Terminal error | `error`, `retryable` |
| `generation:pdf_ready` | PDF generated | `pdfUrl`, `paperId` |

Types: `apps/backend/src/types/socket.types.ts`.

---

## Data models

### Assignment (`assignments`)

- Metadata: title, subject, description, dueDate, duration, totalMarks.
- `questionConfig`, `typeBreakdown`, `additionalInstructions`.
- `uploadedFiles[]`, `status`, `generationMeta`, `generationState`.
- Timestamps: `createdAt`, `updatedAt`.

**Statuses:** `draft`, `queued`, `generating`, `completed`, `failed`, `partially_generated`.

### GenerationJob (`generation_jobs`)

- Links `assignmentId` ↔ BullMQ job id.
- `status`, `progress`, `stage`, `error`, `generationSeq`, versioning.
- Timestamps for start/complete.

### GeneratedPaper (`generated_papers`)

- `assignmentId`, title, `totalMarks`.
- `sections[]` → `questions[]` (MCQ options, marks, difficulty, types).
- `pdfPath`, `pdfUrl`, answer key data.
- `canonicalMetadata` (requested vs generated counts).

---

## File uploads & storage

| `STORAGE_TYPE` | Behavior |
|----------------|----------|
| `local` | Files under `UPLOAD_DIR` (default `./uploads`); Render mounts 1GB disk at `/opt/render/project/uploads` |
| `s3` | AWS S3 via env `S3_*` |
| `cloudinary` | Cloudinary via `CLOUDINARY_*` |

**Allowed types:** PDF, plain text (validated in multer/filter).  
**Extraction:** `pdf-parse` for PDFs; UTF-8 read for TXT.

---

## AI providers

Active chain (see `apps/backend/src/services/ai/`):

| Priority | Provider | Model (approx.) | Notes |
|----------|----------|-----------------|-------|
| 100 | **NVIDIA** | `meta/llama-3.1-8b-instruct` | OpenAI-compatible API |
| 95 | **Groq** | `llama-3.3-70b-versatile` | Fast inference |
| 90 | **Anthropic** | `claude-3-5-sonnet-20241022` | Native SDK fallback |

- **Circuit breaker** skips unhealthy providers; cooldown after failures.
- **Batch sizes** differ per provider (e.g. NVIDIA 3, Groq 4, Anthropic 7 questions per batch).
- **Timeouts:** ~90s per provider call; ~120s overall generation guard in worker.
- Output is **always** parsed and validated (Zod + repair); never rendered raw to users.

`OPENAI_API_KEY` and `@google/generative-ai` are present in dependencies but **not** in the active fallback chain as of this README revision.

---

## Security

| Control | Implementation |
|---------|----------------|
| HTTP headers | Helmet |
| Rate limiting | express-rate-limit (global + generation endpoint) |
| CORS | `FRONTEND_URL` + `vedaai*.vercel.app` previews |
| Input validation | Zod on API bodies and AI output |
| Upload safety | MIME/extension checks, size limits |
| PDF download | Filename sanitization, path traversal prevention |
| Env validation | Fail fast on boot if required vars missing |
| Auth | `JWT_SECRET` required; full JWT middleware not yet enforced on all routes—treat API as open in untrusted networks until auth is enabled |

**Do not commit** `.env`, `.env.local`, or API keys. Use platform secret stores on Vercel/Render.

---

## Testing

### Backend (Vitest)

```bash
cd apps/backend
npm test
npm run test:watch
npm test -- --coverage
```

Test files in `src/__tests__/`:

- `routes.test.ts`
- `assignment.validator.test.ts`
- `batch-generation.test.ts`
- `paper.parser.test.ts`
- `paper.normalizer.test.ts`
- `quality-gate.test.ts`
- `provider-health.test.ts`

Coverage thresholds: 80% (see `vitest.config.ts`).

### Frontend

```bash
cd apps/frontend
npm test   # placeholder — no suite configured yet
```

### Manual E2E checklist

1. Create assignment with PDF upload.
2. Watch generation phases on `/assignments/[id]`.
3. Open paper view; download PDF.
4. Delete assignment from dashboard.
5. Retry failed generation.

---

## Deployment

### Frontend → Vercel

1. Connect repo; set root directory to `apps/frontend` (or monorepo with correct build settings).
2. Environment variables:
   - `NEXT_PUBLIC_API_URL=https://vedaai-test.onrender.com` (or your API URL)
   - `NEXT_PUBLIC_SOCKET_URL` (same as API URL)
3. `vercel.json` rewrites `/api` and `/socket.io` to Render when using relative URLs.

Production frontend URL in Render CORS: **https://vedaai-ed.vercel.app**

### Backend → Render (`render.yaml`)

Two services:

| Service | Type | Name | Port | Start |
|---------|------|------|------|-------|
| API | `web` | `vedaai-api` | 5000 | `bash start-web.sh` |
| Worker | `worker` | `vedaai-worker` | 5001 | `bash start-worker.sh` |

**Build:** `npm install && npm run build --workspace=apps/backend`

**Secrets (sync: false in dashboard):**  
`MONGODB_URI`, `REDIS_URL`, `REDIS_BULLMQ_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, `NVIDIA_API_KEY`, `GROQ_API_KEY`

**Shared disk:** 1GB uploads on both services.

### MongoDB Atlas

1. Create cluster → database user → network access (`0.0.0.0/0` or Render egress IPs).
2. Connection string → `MONGODB_URI` (no angle brackets around password).

### Redis (production)

Use a **non-serverless** Redis with blocking command support for BullMQ. Configure both `REDIS_URL` and `REDIS_BULLMQ_URL` (can be the same instance).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `ERR_CONNECTION_REFUSED` on `:5000` | Frontend pointing at localhost without backend | Set `NEXT_PUBLIC_API_URL` to Render URL or start backend |
| Jobs stay `queued` forever | Workers off or Redis incompatible | `ENABLE_BACKGROUND_WORKERS=true`; use Docker/full Redis |
| No AI output | Missing API keys | Set NVIDIA/Groq/Anthropic keys; check `/api/health/providers` |
| CORS errors | Wrong `FRONTEND_URL` | Add your Vercel URL to `FRONTEND_URL` on Render |
| Socket never connects | Wrong socket URL or blocked WS | Match `NEXT_PUBLIC_SOCKET_URL`; check Vercel rewrites |
| Hydration warnings (`bis_skin_checked`) | Browser extension (e.g. Bitdefender) | Incognito test; harmless in dev |
| PDF fails on Render | Chromium/memory | Check worker logs; ensure worker service running |
| Env not applied in Next | Dev server not restarted | Restart after `.env.local` changes |

**Logs:**

- Backend: Winston to console (see `apps/backend/src` logging config).
- Render: Dashboard → service → Logs (web vs worker).

---

## Additional documentation

| Document | Location | Contents |
|----------|----------|----------|
| Backend architecture | `apps/backend/ARCHITECTURE.md` | Workers, queues, diagrams (verify against code) |
| Local Redis / BullMQ | `apps/backend/BULLMQ-LOCAL-REDIS-SETUP.md` | Windows/local Redis setup |
| Extended notes | `VedaAI_README.md` | Historical/expanded platform doc (may be outdated) |
| UI harness spec | `apps/frontend/gan-harness/spec.md` | Screen-by-screen UI requirements |

When in doubt, **this `README.md` and the source code** take precedence over older docs.

---

## License & contributing

Private project (`"private": true` in `package.json`). Contact repository owners for contribution and licensing terms.

---

**Last updated:** May 2026 — aligned with Next.js 16.2, Render deployment, and NVIDIA → Groq → Anthropic provider chain.

# 🎓 VidyaAI — Enterprise-Grade Asynchronous Assessment & Exam Paper Generator

VidyaAI is a professional, high-performance SaaS platform built to empower educators and academic institutions. By combining modern AI model pipelines with asynchronous background jobs, VidyaAI automates the creation of high-quality, validated, and curriculum-aligned exam papers with matching answer keys and printable A4 PDF exports.

---

## 📋 Table of Contents

1. [Key Features & Capabilities](#-key-features--capabilities)
2. [System Architecture & Data Flow](#-system-architecture--data-flow)
3. [Technology Stack](#-technology-stack)
4. [Monorepo Workspace Blueprint](#-monorepo-workspace-blueprint)
5. [Prerequisites & Core Infrastructure](#-prerequisites--core-infrastructure)
6. [Step-by-Step Local Quickstart](#-step-by-step-local-quickstart)
7. [Environment Variables Matrix](#-environment-variables-matrix)
8. [Asynchronous Generation Pipeline Phases](#-asynchronous-generation-pipeline-phases)
9. [REST API Specification](#-rest-api-specification)
10. [Real-time WebSocket Events Map](#-real-time-websocket-events-map)
11. [Data Model Schema (Prisma Relational Database)](#-data-model-schema-prisma-relational-database)
12. [File Storage Architecture](#-file-storage-architecture)
13. [AI Model Inference & Fallback Chain](#-ai-model-inference--fallback-chain)
14. [Testing & Quality Assurance](#-testing--quality-assurance)
15. [Production Deployment Blueprint](#-production-deployment-blueprint)
16. [DevOps Operations & Troubleshooting Guide](#-devops-operations--troubleshooting-guide)

---

## ✨ Key Features & Capabilities

* **Asynchronous Multi-Source Content Processing**: Accepts dense curriculum documents, reference books, syllabus files, and raw lecture notes (PDF/TXT formats).
* **Asynchronous Parallel AI Batch Generation**: Enqueues and splits question-generation requests across multiple target difficulty tiers (Easy, Medium, Hard) and Bloom's Taxonomy cognitive levels.
* **Fault-Tolerant AI Inference Chain**: Automatic circuit breaking, error-recovery mechanisms, and failover fallbacks between major API gateways (NVIDIA Llama, Groq Llama, Anthropic Claude, and OpenAI).
* **Real-time Live Socket Telemetry**: Feeds live pipeline logs and progress bars directly to the client interface using Socket.IO.
* **Print-Perfect PDF Composability**: Dynamically renders standard A4 exam sheets using a sandboxed headless browser service powered by Puppeteer and Chromium.

---

## ⚙️ System Architecture & Data Flow

```
   ┌──────────────────────────────────────────────────────────────────────────┐
   │                          Teacher's Browser Client                        │
   │      Next.js 16 App Router · Zustand State Store · Socket.IO Client      │
   └────────────────────────────────────┬─────────────────────────────────────┘
                                        │ HTTPS REST  +  WebSocket Protocol
   ┌────────────────────────────────────▼─────────────────────────────────────┐
   │                        Express API Gateway (Backend)                     │
   │      Endpoints · Input Validation (Zod) · Socket.IO Orchestration        │
   └───────────────┬─────────────────────────────────────────┬────────────────┘
                   │                                         │
                   │ Enqueues Jobs                           │ Queries / Persists
                   ▼                                         ▼
   ┌───────────────────────────────┐         ┌────────────────────────────────┐
   │         Redis Server          │         │   PostgreSQL DB (Prisma ORM)   │
   │  · BullMQ Job Queues          │         │  · Users, Orgs, Classrooms     │
   │  · Rate Limit / State Cache   │         │  · Assignments, GeneratedPapers│
   └───────────────┬───────────────┘         └────────────────────────────────┘
                   │
                   │ Dequeues Jobs
                   ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │                        Asynchronous Worker Services                      │
   │                                                                          │
   │  [AI GENERATION WORKER]                                                  │
   │  ├─ Raw text extraction & Preprocessing                                  │
   │  ├─ Concurrent chunk-generation (AI fallback pipeline)                    │
   │  ├─ Structural validations (Zod & Auto-Repair JSON)                      │
   │  └─ Answer Key and marking schema builder                                │
   │                                                                          │
   │  [PDF COMPILER WORKER]                                                   │
   │  └─ Puppeteer headless HTML-to-PDF compiler (A4 layout formatting)       │
   └──────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Tools & Technologies |
|-------|----------------------|
| **Monorepo Architecture** | npm Workspaces (`apps/frontend`, `apps/backend`) |
| **Frontend App** | Next.js 16.2 (App Router), React 19, Tailwind CSS v4, Framer Motion (Transitions), Zustand (State Store), Axios, Socket.IO Client, React Hook Form, Zod |
| **Backend API Server** | Node.js 20+, Express 4, TypeScript 5, Prisma Client, Socket.IO Server, Zod (Request Schemas), Winston/Pino Logger, Helmet, Multer |
| **Job Queueing Engine** | Redis (TCP standard connection) + BullMQ |
| **Database & ORM** | PostgreSQL 15+, Prisma ORM |
| **AI Inference Cluster** | NVIDIA Inference Engine, Groq Cloud API, Anthropic SDK, OpenAI Client SDK |
| **PDF Generation Engine**| Headless Chrome (`puppeteer-core`), `@sparticuz/chromium` |

---

## 📁 Monorepo Workspace Blueprint

```
VidyaAI/
├── package.json                 # Monorepo workspace-wide scripts
├── package-lock.json            # Centralized lockfile
├── docker-compose.yml           # Preconfigured local DB & Redis images
├── render.yaml                  # Unified production blueprint for Render
├── start-web.sh                 # Production shell script: Starts Express web server
├── start-worker.sh              # Production shell script: Starts asynchronous worker processes
├── README.md                    # Primary reference & installation documentation
│
└── apps/
    ├── backend/                 # Asynchronous REST & WS backend engine
    │   ├── src/
    │   │   ├── app.ts           # Unified entry point (bootstraps Web, Sockets & Workers)
    │   │   ├── config/          # Infrastructure configurations (db, env, redis)
    │   │   ├── routes/          # Express route definitions
    │   │   ├── controllers/     # Request handlers & middleware mapping
    │   │   ├── services/        # Core business operations (AI pipelines, Storage, PDF)
    │   │   ├── workers/         # BullMQ worker processors (aiGeneration.worker.ts, pdf.worker.ts)
    │   │   ├── queues/          # Queue interfaces (BullMQ wrappers)
    │   │   ├── sockets/         # WebSocket room controllers & emit events
    │   │   ├── validators/      # Zod request validators
    │   │   ├── prompts/         # AI structured prompt builders
    │   │   ├── parsers/         # Structured JSON parsing & error repair engine
    │   │   └── __tests__/       # Automated test suite (Vitest)
    │   ├── prisma/              # Prisma Database schemas, migrations, and seeds
    │   └── .env.example         # Template configuration for backend
    │
    └── frontend/                # Next.js App Router Single Page App
        ├── src/
        │   ├── app/             # Application route pages
        │   ├── components/      # UI components, layout structures, and modals
        │   ├── hooks/           # Custom React hooks (real-time telemetry, state maps)
        │   ├── store/           # Zustand stores (Client side routing status, telemetry logs)
        │   ├── services/        # Client-side API request service wrappers
        │   ├── lib/             # Shared client libs (Axios instances, Socket connections)
        │   └── config/          # Next.js runtime configurations
        └── .env.local.example   # Template configuration for frontend
```

---

## 📋 Prerequisites & Core Infrastructure

To boot up the VidyaAI platform locally, ensure the following applications and keys are present:

1. **Node.js**: `v20.x.x` (LTS) or higher.
2. **Docker & Compose**: Required for running lightweight containerised local services.
3. **Database Server**: A PostgreSQL 15+ instance (or Supabase).
4. **Asynchronous Redis Instance**: A standard TCP-based Redis server (e.g. Docker Redis). *Note: Upstash Serverless REST endpoints do not support BullMQ blocking loops. A standard TCP interface is required.*
5. **AI API Credentials**: You need at least one valid key from the following:
   * NVIDIA Developer Center API Key
   * Groq Cloud API Key
   * Anthropic Developer Console Key
   * OpenAI Platform Key

---

## 🚀 Step-by-Step Local Quickstart

### 1. Repository Setup & Dependencies Installation
First, clone the project files and resolve packages globally across all npm workspaces:
```bash
git clone <repository-clone-url>
cd VidyaAI
npm install
```

### 2. Launch Local Docker Infrastructure Services
Start PostgreSQL and Redis locally using the preconfigured docker-compose file:
```bash
docker compose up -d
```
Verify they are running on their designated ports:
* **PostgreSQL**: Port `5432`
* **Redis**: Port `6379`

### 3. Configure the Backend Workspace Environment
Create the workspace environment config file:
```bash
cp apps/backend/.env.example apps/backend/.env
```
Open `apps/backend/.env` and update the parameters:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/vidyaai?schema=public"
REDIS_URL="redis://localhost:6379"
REDIS_BULLMQ_URL="redis://localhost:6379"
JWT_SECRET="generate-a-random-secure-string-min-32-characters"
FRONTEND_URL="http://localhost:3000"
NVIDIA_API_KEY="your-nvidia-developer-key"
GROQ_API_KEY="your-groq-cloud-key"
```

Next, configure database schemas and seed default roles:
```bash
cd apps/backend
npx prisma db push
npx prisma db seed
```
Test that the local backend can talk to PostgreSQL and Redis:
```bash
npm run test:connections
```

### 4. Configure the Frontend Workspace Environment
Navigate to the frontend folder and copy the configuration templates:
```bash
cd ../frontend
cp .env.local.example .env.local
```
Update `apps/frontend/.env.local` to point to the local backend:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 5. Running in Development Mode
Return to the monorepo root folder and boot up both workspaces concurrently:
```bash
cd ../..
npm run dev
```
Once initialized, access the clients:
* **Frontend Web Dashboard**: [http://localhost:3000](http://localhost:3000)
* **Backend API Gateway**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 📊 Environment Variables Matrix

### Backend Configurations (`apps/backend/.env`)

| Environment Variable | Required | Default Target | Description |
|----------------------|:--------:|:--------------:|-------------|
| `PORT` | No | `5000` | Port the Express API server listens on |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string with credentials |
| `REDIS_URL` | **Yes** | — | Primary Redis connection endpoint (`redis://...`) |
| `REDIS_BULLMQ_URL` | **Yes** | — | Isolated Redis endpoint dedicated to BullMQ processes |
| `JWT_SECRET` | **Yes** | — | Key used to sign JWT authorization tokens |
| `FRONTEND_URL` | **Yes** | `http://localhost:3000`| Allowed CORS domains (comma-separated list) |
| `ENABLE_BACKGROUND_WORKERS` | No | `true` | Enables or disables background job worker threads |
| `RENDER_WORKER_MODE` | No | `both` | Deployment role: `web` (API only), `worker` (Queues only), `both` |
| `STORAGE_TYPE` | No | `local` | Upload destination: `local` (disk), `s3` (AWS S3), `cloudinary` |
| `UPLOAD_DIR` | No | `./uploads` | Local upload directory path |

### Frontend Configurations (`apps/frontend/.env.local`)

| Environment Variable | Required | Default Target | Description |
|----------------------|:--------:|:--------------:|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:5000` | API Gateway endpoint |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | `http://localhost:5000` | Socket server endpoint |

---

## ⚡ Asynchronous Generation Pipeline Phases

During the generation lifecycle, the assignment status flows from `draft` ➔ `queued` ➔ `generating` ➔ `completed` / `failed` / `partially_generated`.

```
[Queued] ➔ [Content Extraction] ➔ [AI Generation Planning] ➔ [Batch Generation] ➔ [Structure Validations] ➔ [Answer Key Compiling] ➔ [PDF Composability Engine] ➔ [Completed]
```

1. **`queued`**: Job enqueued into BullMQ. Broadcasts `generation:queued` event.
2. **`extracting_content`**: Extracts text from PDFs/TXT files via `pdf-parse`.
3. **`topic_preprocessing`**: Cleans up text and builds context templates.
4. **`generation_planning`**: Determines exact question distributions based on settings.
5. **`batch_generating`**: Triggers parallel API requests based on selected model parameters.
6. **`validating`**: Runs output schema validations and repairs broken JSON.
7. **`answer_key_generating`**: Synthesizes the correct marking keys.
8. **`pdf_composing`**: Composites styles and margins into printable structures.
9. **`persisting`**: Commits output structures directly to PostgreSQL.
10. **`pdf-generating`**: Puppeteer compiles the visual pages. Broadcasts `generation:pdf_ready`.

---

## 📡 REST API Specification

### Health Metrics
* `GET /health` : Global check. Returns status code `200` when databases and servers are healthy.
* `GET /api/health/redis` : Tests latency and connectivity to Redis caches.
* `GET /api/health/providers` : Checks active AI credential configurations.

### Assignment Management
* `GET /api/assignments` : Retrieves a paginated list of created assignments.
* `POST /api/assignments` : Creates a new assignment entry and triggers the AI background generation workflow (Multipart request).
* `GET /api/assignments/:id` : Returns current details and logs for a specific assignment.
* `DELETE /api/assignments/:id` : Removes the database entries, PDF, and source files.
* `POST /api/assignments/:id/generate` : Retriggers the generation cycle for a failed run.

---

## 🔌 Real-time WebSocket Events Map

All telemetry logs and generation updates are broadcasted through Socket.IO namespaces using standard JSON.

### Client-to-Server Emissions
* `subscribe:assignment` : Joins target room `assignment:{assignmentId}`.
* `unsubscribe:assignment` : Leaves target room.

### Server-to-Client Broadcasts
* `generation:queued` : Indicates the job is scheduled in the queue.
* `generation:progress` : Periodic payload containing progress percentage, phase name, and execution log message.
* `generation:completed` : Confirms successful paper creation. Includes final question count details.
* `generation:failed` : Emitted on terminal failure. Contains details on whether the job can be retried.
* `generation:pdf_ready` : Broadcasts the public storage link for download once the PDF compiles.

---

## 🗄️ Data Model Schema (Prisma Relational Database)

The database utilizes Prisma Client connected to PostgreSQL. Key relational models:

* **Organization**: Handles multi-tenant partitions, access keys, and tier quotas.
* **User**: Profiles with secure hashing (Argon2) and role categories (`SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`).
* **Classroom**: Links cohorts, courses, grades, and enrollments.
* **Workflow / Assignment**: Real-time lifecycle tracks, settings, file directories, and prompt targets.
* **GeneratedPaper**: Holds the final sections, question nodes, and PDF output targets.

---

## 📂 File Storage Architecture

VidyaAI supports three primary file storage providers configured via the `STORAGE_TYPE` env variable:

1. **`local`**: Saves files to disk. In cluster environments, use shared storage mounts.
2. **`s3`**: Uploads directly to AWS S3 (requires `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`).
3. **`cloudinary`**: Connects via the Cloudinary API.

---

## 🤖 AI Model Inference & Fallback Chain

To maintain high availability and work around API rate limits, the backend utilizes an automated fallback chain:

```
NVIDIA Llama (Primary) ➔ Groq Llama (Fallback 1) ➔ Anthropic Claude (Fallback 2) ➔ OpenAI GPT (Fallback 3)
```

* **Circuit Breaking**: Providers that return errors (e.g. rate-limit `429`s or timeouts) are temporarily quarantined and skipped.
* **Adaptive Batching**: Workers dynamically adjust batch sizes depending on the active provider's capacity limits.

---

## 🧪 Testing & Quality Assurance

Run the backend test suite powered by Vitest:
```bash
cd apps/backend
npm run test
```

Generate coverage reports to inspect code pathways:
```bash
npm run test -- --coverage
```
*A coverage threshold of 80% is enforced in `vitest.config.ts`.*

---

## 🌐 Production Deployment Blueprint

### Frontend Hosting (Vercel)
1. Add the repository to Vercel. Set the Root Directory to `apps/frontend`.
2. Configure environment variables: Set `NEXT_PUBLIC_API_URL` to your production API gateway.

### Backend Hosting (Render Services)
Deploy two separate services using the backend code:

1. **API Web Service (`vidyaai-api`)**:
   * **Start Command**: `bash start-web.sh`
   * **Environment Variable**: `RENDER_WORKER_MODE=web`
2. **Background Worker Service (`vidyaai-worker`)**:
   * **Start Command**: `bash start-worker.sh`
   * **Environment Variable**: `RENDER_WORKER_MODE=worker`

---

## 🛠️ DevOps Operations & Troubleshooting Guide

### 1. Jobs Stay Stuck in the "Queued" State
* **Root Cause**: The background worker process is offline, or the Redis server is not accepting incoming TCP connections.
* **Fix**: Verify that `ENABLE_BACKGROUND_WORKERS=true` is set on the worker instance, and check your Redis server logs.

### 2. Connection Refused on Backend Port (`5000`)
* **Root Cause**: Next.js is configured to talk to port `5000` but the Express server has crashed or failed to start due to missing environment variables.
* **Fix**: Run `npm run test:connections` in the backend workspace to check for missing environment configuration values.

### 3. PDF Compile Phase Fails
* **Root Cause**: Chromium or Puppeteer dependencies are missing from the OS environment, causing the web-to-pdf renderer to crash.
* **Fix**: Ensure that `@sparticuz/chromium` is correctly installed on serverless platforms, or check that Chrome is installed on the host OS.

# VedaAI — AI-Powered Assessment Creator

> A production-grade AI SaaS platform for teachers to generate structured, validated exam papers in real time.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)](https://nextjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=nodedotjs)](https://nodejs.org)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     USER (Browser)                          │
│  Next.js 15 App Router + Zustand + Socket.IO Client         │
└─────────────────┬───────────────────────────────────────────┘
                  │ REST + WebSocket
┌─────────────────▼───────────────────────────────────────────┐
│                  EXPRESS API SERVER                          │
│  Routes → Controllers → Services → Models                   │
│  Socket.IO Server (room-based subscriptions)                │
└──────────┬─────────────────────────┬───────────────────────┘
           │ BullMQ Queue            │ MongoDB (Mongoose)
┌──────────▼──────────┐   ┌──────────▼──────────────────────┐
│    Redis (Upstash)  │   │   MongoDB Atlas                  │
│    - job queue      │   │   - assignments                  │
│    - retry state    │   │   - generated_papers             │
└──────────┬──────────┘   │   - generation_jobs              │
           │              └─────────────────────────────────┘
┌──────────▼──────────────────────────────────────────────────┐
│               WORKERS (BullMQ)                              │
│  aiGenerationWorker → generatePaper() → parsePaperJson()    │
│  pdfWorker → Puppeteer → A4 PDF                             │
│                                                             │
│  AI Fallback Chain:                                         │
│  OpenAI GPT-4o → Anthropic Claude → Gemini Pro → NVIDIA    │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop (for local MongoDB + Redis)
- At least one AI API key (OpenAI, Anthropic, Gemini, or NVIDIA)

### 1. Clone & Install

```bash
git clone <repo-url>
cd vedaai
npm install   # installs root + workspace deps
```

### 2. Start local services

```bash
docker-compose up -d   # starts MongoDB on :27017 and Redis on :6379
```

### 3. Configure environment

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Fill in: MONGODB_URI, REDIS_URL, and at least one AI API key

# Frontend
cp apps/frontend/.env.local.example apps/frontend/.env.local
# Fill in: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SOCKET_URL
```

### 4. Run

```bash
# Run both together:
npm run dev

# Or individually:
cd apps/backend && npm run dev   # http://localhost:5000
cd apps/frontend && npm run dev  # http://localhost:3000
```

---

## 📁 Project Structure

```
apps/
├── frontend/           Next.js 15 App Router
│   └── src/
│       ├── app/        Pages & layouts
│       ├── components/ Reusable UI components
│       ├── hooks/      Custom React hooks
│       ├── store/      Zustand state stores
│       ├── services/   API client functions
│       ├── sockets/    Socket.IO client
│       ├── types/      TypeScript interfaces
│       └── schemas/    Zod validation schemas
│
└── backend/            Express + BullMQ API server
    └── src/
        ├── config/     DB, Redis, env
        ├── controllers/ HTTP handlers
        ├── routes/     API route definitions
        ├── services/   Business logic
        ├── workers/    BullMQ job processors
        ├── queues/     BullMQ queue setup
        ├── sockets/    Socket.IO server
        ├── models/     Mongoose schemas
        ├── validators/ Zod input validators
        ├── prompts/    AI prompt builders
        ├── parsers/    JSON response parsers
        └── types/      TypeScript types
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/assignments` | List all assignments (paginated) |
| `POST` | `/api/assignments` | Create assignment + trigger generation |
| `GET` | `/api/assignments/:id` | Get single assignment |
| `DELETE` | `/api/assignments/:id` | Delete assignment |
| `GET` | `/api/papers/assignment/:id` | Get generated paper |
| `GET` | `/api/papers/download/:fileName` | Download PDF |
| `GET` | `/api/papers/job/:assignmentId` | Get job status |

### Create Assignment Request

```http
POST /api/assignments
Content-Type: multipart/form-data

title: "Computer Networks Mid-term"
subject: "Computer Science"
description: "Chapters 1–5"
dueDate: "2025-12-31"
duration: 90
totalMarks: 100
questionConfig: {"types":["mcq","short-answer"],"count":10,"difficulty":{"easy":34,"medium":33,"hard":33}}
additionalInstructions: "Focus on TCP/IP protocols"
files: [optional PDF/TXT files]
```

---

## 🔌 WebSocket Events

### Client → Server
```typescript
socket.emit('subscribe:assignment',   { assignmentId: string })
socket.emit('unsubscribe:assignment', { assignmentId: string })
```

### Server → Client
```typescript
socket.on('generation:queued',     { assignmentId, jobId, position })
socket.on('generation:processing', { assignmentId, progress, stage, message })
socket.on('generation:progress',   { assignmentId, progress, stage, message })
socket.on('generation:completed',  { assignmentId, paperId })
socket.on('generation:failed',     { assignmentId, error, retryable })
```

---

## 🤖 AI Generation Pipeline

```
1. Form submitted → API validates with Zod
2. Assignment saved to MongoDB (status: 'draft')
3. BullMQ job enqueued (attempts: 3, backoff: exponential)
4. WebSocket emits 'generation:queued'
5. Worker picks up job → emits 'generation:processing'
6. Uploaded files extracted (PDF parsed, TXT read)
7. Dynamic prompt built from assignment config
8. AI provider chain tried (OpenAI → Anthropic → Gemini → NVIDIA)
9. Response parsed: JSON.parse() + Zod schema validation
10. If parse fails: retry up to 3× per provider, then fallback
11. Validated paper saved to MongoDB
12. WebSocket emits 'generation:completed'
13. PDF queue job added → Puppeteer generates A4 PDF
14. Frontend auto-redirects to paper view
```

### Generated Paper JSON Format

```json
{
  "title": "Computer Networks Assessment",
  "totalMarks": 100,
  "sections": [
    {
      "title": "Section A — Multiple Choice",
      "instruction": "Choose the best answer for each question",
      "questions": [
        {
          "id": "uuid-v4",
          "question": "Which layer of the OSI model handles routing?",
          "type": "mcq",
          "difficulty": "medium",
          "marks": 2,
          "options": [
            { "key": "A", "text": "Data Link" },
            { "key": "B", "text": "Network" },
            { "key": "C", "text": "Transport" },
            { "key": "D", "text": "Session" }
          ]
        }
      ]
    }
  ]
}
```

---

## 🗄️ Database Schema

### Assignments Collection
```typescript
{
  _id, title, subject, description, dueDate, duration, totalMarks,
  questionConfig: { types[], count, difficulty: { easy, medium, hard } },
  uploadedFiles: [{ originalName, storedName, mimeType, size, path }],
  additionalInstructions, status, createdAt, updatedAt
}
```

### GeneratedPapers Collection
```typescript
{
  _id, assignmentId, title, totalMarks,
  sections: [{ title, instruction, questions[] }],
  pdfPath, pdfUrl, generatedAt
}
```

### GenerationJobs Collection
```typescript
{
  _id, assignmentId, bullmqJobId, status, progress,
  error, startedAt, completedAt
}
```

---

## 🧪 Testing

```bash
# Backend unit + integration tests
cd apps/backend && npm test

# Watch mode
cd apps/backend && npm run test:watch

# Coverage report
cd apps/backend && npm run test -- --coverage
```

---

## 🚀 Deployment

### Frontend → Vercel
```bash
cd apps/frontend
npx vercel --prod
# Set environment variables in Vercel dashboard
```

### Backend → Railway
```bash
# Connect GitHub repo to Railway
# Set environment variables:
# NODE_ENV=production
# MONGODB_URI=<Atlas URI>
# REDIS_URL=<Upstash URL>
# OPENAI_API_KEY=<key>
# FRONTEND_URL=<vercel-url>
```

### MongoDB Atlas
1. Create cluster at cloud.mongodb.com
2. Add IP whitelist: `0.0.0.0/0` (or Railway's static IP)
3. Copy connection string → `MONGODB_URI`

### Upstash Redis
1. Create database at upstash.com
2. Copy Redis URL → `REDIS_URL`

---

## 🔐 Environment Variables

### Backend (`apps/backend/.env`)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
NVIDIA_API_KEY=nvapi-...
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=./uploads
```

### Frontend (`apps/frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🔒 Security Features

- Helmet.js for HTTP security headers
- Rate limiting (100 req/15min per IP)
- File upload type validation (PDF/TXT only)
- Zod schema validation on all API inputs
- Path traversal prevention for PDF downloads
- CORS restricted to frontend origin
- AI output never rendered raw — always parsed & validated
- Environment variable validation at startup



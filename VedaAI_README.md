# VedaAI — AI Assessment Creator Platform

> **Canonical documentation:** See **[README.md](./README.md)** in this directory for the up-to-date end-to-end setup, API, deployment, and operations guide. This file is retained as extended historical/reference material and may not match the current codebase in every detail.

A production-grade full-stack AI-powered platform enabling educators to generate intelligent exam papers with structured question hierarchies, real-time processing, and PDF export capabilities.

**Live Demo:** [Deployed Link](#deployment)  
**GitHub:** [Repository Link](#)  
**Figma Design:** [Design System](https://www.figma.com/design/nB2HMm1BhTpmHcHrmEslGB/VedaAI---Hiring-Assignment?node-id=0-1&t=UjYQLgEek4u99AA4-1)

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Core Features](#core-features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Setup Instructions](#setup-instructions)
6. [API Documentation](#api-documentation)
7. [WebSocket Events](#websocket-events)
8. [Queue Architecture](#queue-architecture)
9. [Database Schema](#database-schema)
10. [AI Generation Pipeline](#ai-generation-pipeline)
11. [Deployment Guide](#deployment-guide)
12. [Testing Strategy](#testing-strategy)
13. [Performance Optimization](#performance-optimization)
14. [Troubleshooting](#troubleshooting)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                        │
│  (Next.js 15 App Router, TypeScript, TailwindCSS, Zustand) │
└──────────────────┬──────────────────┬──────────────────────┘
                   │                  │
            ┌──────▼──────┐   ┌──────▼──────┐
            │  REST API   │   │  WebSocket  │
            │ (HTTP/HTTPS)│   │  (Socket.IO)│
            └──────┬──────┘   └──────┬──────┘
                   │                  │
┌──────────────────▼──────────────────▼──────────────────────┐
│                    API GATEWAY LAYER                        │
│  (Express.js TypeScript, Request Validation, Auth)         │
└──────────────┬──────────────────┬──────────────────────────┘
               │                  │
        ┌──────▼──────┐   ┌──────▼──────┐
        │ Controllers │   │  WebSocket  │
        │  & Routes   │   │   Handler   │
        └──────┬──────┘   └──────┬──────┘
               │                  │
┌──────────────▼──────────────────▼──────────────────────────┐
│                   BUSINESS LOGIC LAYER                      │
│  (Services, Validators, AI Orchestration, Parsers)         │
└──────────────┬──────────────────┬──────────────────────────┘
               │                  │
        ┌──────▼──────┐   ┌──────▼──────┐
        │   BullMQ    │   │   MongoDB   │
        │   Queues    │   │   Atlas     │
        └──────┬──────┘   └──────┬──────┘
               │                  │
        ┌──────▼──────┐   ┌──────▼──────┐
        │ AI Workers  │   │  Mongoose   │
        │  (Queue)    │   │   Models    │
        └──────┬──────┘   └──────┬──────┘
               │                  │
        ┌──────▼──────────────────▼──────┐
        │  LLM Integration (Claude/GPT)  │
        └────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    DATA & CACHE LAYER                       │
│  (Redis via Upstash, MongoDB Atlas, Puppeteer for PDF)     │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Agent Orchestration

This project uses a specialized multi-agent system for quality assurance:

| Agent | Role | Responsibilities |
|-------|------|------------------|
| **chief-of-staff** | Global Orchestration | Dependency coordination, milestone validation |
| **planner** | Architecture Planning | Implementation roadmap, phase sequencing |
| **architect** | System Design | Database schema, API contracts, service boundaries |
| **code-architect** | Code Structure | Modular organization, folder hierarchy |
| **gan-generator** | UI Implementation | Figma fidelity, animations, responsive layouts |
| **typescript-reviewer** | Type Safety | DTO validation, strict typing enforcement |
| **security-reviewer** | Backend Hardening | Input validation, prompt sanitization |
| **database-reviewer** | Database Optimization | Indexing strategy, query efficiency |
| **tdd-guide** | Testing | Unit, integration, E2E test coverage |

---

## Core Features

### 1. Assignment Creation
Teachers define exam parameters through an intuitive form:
- **Basic Info:** Title, subject, description, due date, total duration, marks
- **Question Configuration:** Types (MCQ, short-answer, essay), marks distribution, difficulty ratios
- **Content Upload:** Optional PDF/text material for context-aware generation
- **Advanced Options:** Custom instructions, section-specific guidance

### 2. AI Question Generation
Intelligent generation pipeline:
- Converts teacher input into structured prompts
- Generates hierarchical sections (A, B, C, etc.)
- Assigns difficulty levels (easy/medium/hard)
- Ensures mark consistency and question quality
- Validates all output before database persistence

### 3. Real-Time Processing
WebSocket-powered live updates:
- **queued** → Job accepted and queued
- **processing** → Worker processing started
- **generating** → LLM generating content
- **parsing** → Validating and parsing response
- **saving** → Persisting to database
- **pdf-generating** → Creating PDF document
- **completed** → Ready for download/viewing
- **failed** → Error handling with recovery

### 4. Professional Output Rendering
Exam paper displays with:
- Student information section (Name, Roll Number, Section)
- Subject header with duration and marks
- Hierarchical section organization
- Individual question formatting with marks and difficulty badges
- Mobile-responsive design
- Print-optimized layout

### 5. PDF Export
High-quality PDF generation via Puppeteer:
- A4 page formatting
- Professional headers and footers
- Page numbering
- Proper margins and typography
- School branding placeholder

---

## Technology Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js | React framework with App Router | 15.x |
| TypeScript | Type safety | 5.x |
| TailwindCSS | Utility-first styling | 4.x |
| shadcn/ui | Component library | Latest |
| Zustand | State management | 4.x |
| React Hook Form | Form handling | 7.x |
| Zod | Schema validation | 3.x |
| Socket.IO Client | WebSocket client | 4.x |
| Framer Motion | Animations | 11.x |
| Playwright | E2E testing | 1.x |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js | Runtime | 20.x LTS |
| Express.js | Web framework | 4.x |
| TypeScript | Type safety | 5.x |
| MongoDB | Primary database | Latest |
| Mongoose | ODM | 8.x |
| Redis | Cache and queue store | Latest |
| BullMQ | Job queue | 5.x |
| Socket.IO | WebSocket server | 4.x |
| Puppeteer | PDF generation | 22.x |
| OpenAI/Claude SDK | LLM integration | Latest |
| Jest | Unit testing | 29.x |
| Supertest | API testing | 6.x |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Frontend deployment |
| Railway | Backend deployment |
| MongoDB Atlas | Cloud database |
| Upstash | Managed Redis |
| GitHub | Version control & CI/CD |

---

## Project Structure

### Root Organization
```
vedaai/
├── apps/
│   ├── frontend/          # Next.js application
│   └── backend/           # Express backend
├── .github/
│   └── workflows/         # CI/CD pipelines
├── docker-compose.yml     # Local development
├── README.md
└── CONTRIBUTING.md
```

### Frontend Structure
```
frontend/src/
├── app/                   # Next.js App Router
│   ├── (auth)/           # Authentication routes
│   ├── dashboard/        # Dashboard page
│   ├── assignments/      # Assignment routes
│   │   ├── create/       # Create assignment form
│   │   ├── [id]/         # Assignment details
│   │   └── output/       # Generated paper view
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/           # Reusable UI components
│   ├── common/          # Shared components (Button, Input, etc.)
│   ├── forms/           # Form components
│   ├── layout/          # Layout components (Header, Sidebar)
│   └── output/          # Output paper components
├── modules/             # Feature modules
│   ├── assignments/     # Assignment logic
│   ├── generation/      # Generation workflow
│   └── auth/            # Authentication module
├── hooks/               # Custom React hooks
│   ├── useAssignment.ts
│   ├── useGeneration.ts
│   ├── useWebSocket.ts
│   └── useForm.ts
├── store/               # Zustand stores
│   ├── assignmentStore.ts
│   ├── generationStore.ts
│   ├── uiStore.ts
│   └── authStore.ts
├── services/            # API and service layer
│   ├── api.ts
│   ├── assignmentService.ts
│   ├── generationService.ts
│   └── fileService.ts
├── sockets/             # WebSocket clients
│   ├── generationSocket.ts
│   └── socketProvider.tsx
├── providers/           # React context providers
│   ├── SocketProvider.tsx
│   └── AuthProvider.tsx
├── lib/                 # Utilities
│   ├── axios.ts         # Axios instance
│   ├── validation.ts
│   ├── formatting.ts
│   └── constants.ts
├── types/               # TypeScript types
│   ├── index.ts
│   ├── assignment.ts
│   ├── generation.ts
│   └── api.ts
├── schemas/             # Zod validation schemas
│   ├── assignment.ts
│   ├── generation.ts
│   └── auth.ts
├── utils/               # Utility functions
│   ├── cn.ts            # Class name merger
│   ├── formatters.ts
│   ├── validators.ts
│   └── helpers.ts
├── styles/              # Global styles
│   ├── globals.css
│   └── variables.css
├── __tests__/           # Test files (mirror structure)
│   ├── services/
│   ├── hooks/
│   ├── utils/
│   └── e2e/
└── .env.local           # Environment variables
```

### Backend Structure
```
backend/src/
├── config/              # Configuration
│   ├── env.ts          # Environment validation
│   ├── database.ts     # MongoDB connection
│   ├── redis.ts        # Redis configuration
│   └── constants.ts    # Global constants
├── controllers/         # Request handlers
│   ├── assignmentController.ts
│   ├── generationController.ts
│   ├── authController.ts
│   └── healthController.ts
├── routes/              # Express routes
│   ├── assignments.ts
│   ├── generation.ts
│   ├── auth.ts
│   └── health.ts
├── middlewares/         # Express middlewares
│   ├── auth.ts
│   ├── validation.ts
│   ├── errorHandler.ts
│   └── corsHandler.ts
├── services/            # Business logic
│   ├── assignmentService.ts
│   ├── generationService.ts
│   ├── authService.ts
│   ├── fileService.ts
│   └── pdfService.ts
├── workers/             # BullMQ workers
│   ├── aiGenerationWorker.ts
│   ├── pdfGenerationWorker.ts
│   └── cleanupWorker.ts
├── queues/              # Queue definitions
│   ├── generationQueue.ts
│   ├── pdfQueue.ts
│   └── queueManager.ts
├── sockets/             # WebSocket handlers
│   ├── generationSocket.ts
│   ├── socketManager.ts
│   └── eventTypes.ts
├── models/              # Mongoose schemas
│   ├── Assignment.ts
│   ├── GeneratedPaper.ts
│   ├── GenerationJob.ts
│   ├── User.ts
│   └── Notification.ts
├── validators/          # Request validation
│   ├── assignmentValidator.ts
│   ├── generationValidator.ts
│   └── fileValidator.ts
├── prompts/             # LLM prompts
│   ├── generateQuestions.ts
│   ├── parseResponse.ts
│   └── systemPrompts.ts
├── parsers/             # Response parsers
│   ├── aiResponseParser.ts
│   ├── jsonParser.ts
│   └── validationParser.ts
├── utils/               # Utility functions
│   ├── logger.ts
│   ├── errorHandler.ts
│   ├── validators.ts
│   ├── formatters.ts
│   └── helpers.ts
├── types/               # TypeScript types
│   ├── index.ts
│   ├── models.ts
│   ├── api.ts
│   ├── generation.ts
│   └── socket.ts
├── __tests__/           # Test files
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── app.ts               # Express app setup
├── server.ts            # Server entry point
├── .env.example         # Example environment
└── .env.local           # Local environment
```

---

## Setup Instructions

### Prerequisites
- Node.js 20.x LTS
- npm 10.x or pnpm 8.x
- MongoDB Atlas account
- Upstash Redis account
- OpenAI API key (or Claude API key)
- Git

### Local Development Setup

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/vedaai.git
cd vedaai
```

#### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd apps/frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Return to root
cd ../..
```

#### 3. Environment Configuration

**Backend Environment** (`apps/backend/.env.local`)
```env
# Server
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vedaai?retryWrites=true&w=majority

# Redis / Upstash
REDIS_URL=redis://:password@host:port
# OR for Upstash (HTTPS with password)
UPSTASH_REDIS_URL=https://user:password@region.upstash.io

# AI / LLM
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
LLM_PROVIDER=openai  # or 'anthropic'
LLM_MODEL=gpt-4-turbo  # or 'claude-opus-4-1'

# JWT
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000

# WebSocket
WEBSOCKET_CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=pdf,txt

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app_password

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# Queue Configuration
BULL_QUEUE_DEFAULT_BACKOFF_DELAY=5000
BULL_QUEUE_MAX_ATTEMPTS=3
```

**Frontend Environment** (`apps/frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:5000
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_SITE_NAME=VedaAI
NEXT_PUBLIC_SITE_DESCRIPTION=AI Assessment Creator Platform
```

#### 4. Database Setup

**Initialize MongoDB Atlas**
1. Create cluster at mongodb.com/atlas
2. Create database user
3. Add IP to whitelist (0.0.0.0/0 for development)
4. Get connection string
5. Update `MONGODB_URI` in backend `.env.local`

**Run Migrations** (if applicable)
```bash
cd apps/backend
npm run db:migrate
```

#### 5. Redis Setup

**Option A: Upstash (Recommended for Development)**
1. Sign up at upstash.com
2. Create Redis database
3. Copy connection URL
4. Update `UPSTASH_REDIS_URL` in backend `.env.local`

**Option B: Local Redis**
```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis-server

# Windows (via WSL2)
wsl --install
sudo apt-get install redis-server
```

#### 6. Start Development Servers

**Terminal 1: Backend**
```bash
cd apps/backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2: Frontend**
```bash
cd apps/frontend
npm run dev
# App runs on http://localhost:3000
```

**Terminal 3: Queue Dashboard (optional but useful)**
```bash
cd apps/backend
npm run bull:dashboard
# BullMQ dashboard on http://localhost:3001
```

#### 7. Verify Setup

Visit http://localhost:3000 to access the application.

Check backend health:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-03-21T10:30:00Z",
  "uptime": 125.43
}
```

### Docker Setup (Alternative)

```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Troubleshooting Setup

**Port Already in Use**
```bash
# Find process using port
lsof -i :5000  # Backend
lsof -i :3000  # Frontend

# Kill process
kill -9 <PID>
```

**Redis Connection Issues**
```bash
# Test Redis connection
redis-cli ping
# Expected: PONG

# For Upstash, use:
redis-cli -u redis://:password@host:port ping
```

**MongoDB Connection Error**
- Verify IP whitelist in MongoDB Atlas
- Check connection string format
- Ensure database user has correct permissions

---

## API Documentation

### Base URL
```
Production: https://api.vedaai.com
Development: http://localhost:5000
```

### Authentication

All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Assignment Endpoints

#### Create Assignment
```http
POST /api/v1/assignments
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Data Structures Midterm",
  "subject": "Computer Science",
  "description": "Comprehensive exam covering arrays, linked lists, trees",
  "dueDate": "2024-04-15T23:59:59Z",
  "duration": 120,
  "totalMarks": 100,
  "questionConfig": {
    "types": ["mcq", "short-answer", "essay"],
    "totalQuestions": 25,
    "marksDistribution": {
      "mcq": 25,
      "short-answer": 50,
      "essay": 25
    },
    "difficultyRatio": {
      "easy": 0.3,
      "medium": 0.4,
      "hard": 0.3
    }
  },
  "additionalInstructions": "Show all working for numerical questions",
  "customInstructions": {
    "sectionA": "Attempt all MCQ questions"
  }
}

Response:
{
  "success": true,
  "data": {
    "id": "6607a8f9c1234d567890abcd",
    "title": "Data Structures Midterm",
    "status": "draft",
    "createdAt": "2024-03-21T10:30:00Z",
    "createdBy": "teacher_id"
  }
}
```

**Status Codes:**
- `201` - Created successfully
- `400` - Validation error
- `401` - Unauthorized
- `500` - Server error

#### Get Assignments
```http
GET /api/v1/assignments?skip=0&limit=10&status=draft
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "6607a8f9c1234d567890abcd",
      "title": "Data Structures Midterm",
      "subject": "Computer Science",
      "status": "draft",
      "createdAt": "2024-03-21T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "skip": 0,
    "limit": 10,
    "pages": 5
  }
}
```

#### Get Assignment by ID
```http
GET /api/v1/assignments/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "6607a8f9c1234d567890abcd",
    "title": "Data Structures Midterm",
    "subject": "Computer Science",
    "description": "...",
    "totalMarks": 100,
    "status": "draft",
    "generatedPapers": []
  }
}
```

#### Update Assignment
```http
PATCH /api/v1/assignments/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Updated Title",
  "description": "Updated description"
}

Response:
{
  "success": true,
  "data": { /* updated assignment */ }
}
```

#### Delete Assignment
```http
DELETE /api/v1/assignments/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Assignment deleted"
}
```

#### Upload Material
```http
POST /api/v1/assignments/:id/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- file: <PDF or TXT file>
- type: "pdf" | "text"

Response:
{
  "success": true,
  "data": {
    "fileId": "file_123",
    "fileName": "chapter_notes.pdf",
    "size": 524288,
    "type": "pdf"
  }
}
```

### Generation Endpoints

#### Trigger Question Generation
```http
POST /api/v1/assignments/:id/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "regenerate": false,
  "config": {
    "questionCount": 25,
    "marksDistribution": {
      "mcq": 25,
      "short-answer": 50,
      "essay": 25
    }
  }
}

Response:
{
  "success": true,
  "data": {
    "jobId": "job_6607a8f9c1234d567890abcd",
    "paperId": "paper_6607a8f9c1234d567890abcd",
    "status": "queued"
  }
}
```

WebSocket event will emit status updates.

#### Get Generation Status
```http
GET /api/v1/generation/:jobId/status
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "jobId": "job_6607a8f9c1234d567890abcd",
    "status": "processing",
    "progress": 65,
    "currentStep": "Generating essay questions"
  }
}
```

#### Get Generated Paper
```http
GET /api/v1/papers/:paperId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "paper_6607a8f9c1234d567890abcd",
    "assignmentId": "assignment_id",
    "title": "Data Structures Midterm",
    "totalMarks": 100,
    "duration": 120,
    "generatedAt": "2024-03-21T10:35:00Z",
    "sections": [
      {
        "id": "section_1",
        "title": "Section A",
        "instruction": "Attempt all questions",
        "questions": [
          {
            "id": "q_1",
            "question": "What is a data structure?",
            "type": "short-answer",
            "marks": 5,
            "difficulty": "easy"
          }
        ]
      }
    ]
  }
}
```

#### Export to PDF
```http
POST /api/v1/papers/:paperId/export-pdf
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "pdfUrl": "https://storage.vedaai.com/pdfs/paper_123.pdf",
    "fileName": "data-structures-midterm.pdf",
    "size": 1048576
  }
}
```

### Error Response Format

All error responses follow this format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  },
  "timestamp": "2024-03-21T10:30:00Z"
}
```

**Error Codes:**
| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `GENERATION_FAILED` | 500 | AI generation failed |

---

## WebSocket Events

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### Generation Events

#### Subscribe to Generation Updates
```javascript
socket.emit('generation:subscribe', {
  jobId: 'job_6607a8f9c1234d567890abcd'
});
```

#### Receive Generation Status

**queued**
```javascript
socket.on('generation:queued', (data) => {
  // {
  //   jobId: string,
  //   paperId: string,
  //   timestamp: string
  // }
});
```

**processing**
```javascript
socket.on('generation:processing', (data) => {
  // {
  //   jobId: string,
  //   status: 'processing',
  //   progress: 0,
  //   timestamp: string
  // }
});
```

**progress**
```javascript
socket.on('generation:progress', (data) => {
  // {
  //   jobId: string,
  //   progress: number (0-100),
  //   currentStep: string,
  //   estimatedTime: number (seconds),
  //   timestamp: string
  // }
});
```

**generating**
```javascript
socket.on('generation:generating', (data) => {
  // {
  //   jobId: string,
  //   progress: 30,
  //   currentStep: 'Generating questions for Section A',
  //   timestamp: string
  // }
});
```

**parsing**
```javascript
socket.on('generation:parsing', (data) => {
  // {
  //   jobId: string,
  //   progress: 70,
  //   currentStep: 'Validating and parsing response',
  //   timestamp: string
  // }
});
```

**saving**
```javascript
socket.on('generation:saving', (data) => {
  // {
  //   jobId: string,
  //   progress: 85,
  //   currentStep: 'Saving to database',
  //   timestamp: string
  // }
});
```

**pdf-generating**
```javascript
socket.on('generation:pdf-generating', (data) => {
  // {
  //   jobId: string,
  //   progress: 95,
  //   currentStep: 'Generating PDF',
  //   timestamp: string
  // }
});
```

**completed**
```javascript
socket.on('generation:completed', (data) => {
  // {
  //   jobId: string,
  //   paperId: string,
  //   progress: 100,
  //   paper: { /* full paper object */ },
  //   pdfUrl: string,
  //   timestamp: string
  // }
});
```

**failed**
```javascript
socket.on('generation:failed', (data) => {
  // {
  //   jobId: string,
  //   error: string,
  //   errorCode: string,
  //   timestamp: string
  // }
});
```

### Disconnection
```javascript
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.disconnect();
```

### Reconnection with Auto-Subscribe
```javascript
socket.on('reconnect', () => {
  // Resubscribe to generation events
  socket.emit('generation:subscribe', {
    jobId: previousJobId
  });
});
```

---

## Queue Architecture

### BullMQ Configuration

#### Generation Queue
```
Name: generationQueue
Purpose: AI question generation
Workers: Parallel processing (3-5 workers)
Retry: Exponential backoff (3 attempts)
```

**Job Payload:**
```typescript
interface GenerationJob {
  assignmentId: string;
  paperId: string;
  config: {
    questionCount: number;
    marksDistribution: Record<string, number>;
    difficultyRatio: Record<string, number>;
  };
  material?: {
    fileId: string;
    content: string;
  };
}
```

**Worker Implementation:**
```typescript
import { Worker } from 'bullmq';
import connection from '@/config/redis';

const generationWorker = new Worker(
  'generationQueue',
  async (job) => {
    const { assignmentId, paperId, config } = job.data;
    
    // Progress updates
    job.progress(0);
    
    // Generate prompt
    const prompt = buildGenerationPrompt(config);
    job.progress(25);
    
    // Call LLM
    const response = await callLLM(prompt);
    job.progress(50);
    
    // Parse response
    const parsed = parseAIResponse(response);
    job.progress(75);
    
    // Validate and save
    const paper = await savePaper(paperId, parsed);
    job.progress(100);
    
    return { paperId, paper };
  },
  { connection }
);

generationWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
  // Emit failure event via WebSocket
});
```

#### PDF Queue
```
Name: pdfQueue
Purpose: PDF generation and export
Workers: Parallel processing (2-3 workers)
Retry: Exponential backoff (2 attempts)
```

**Job Payload:**
```typescript
interface PDFJob {
  paperId: string;
  format: 'standard' | 'answer-key';
  options?: {
    includeAnswers?: boolean;
    watermark?: string;
  };
}
```

### Queue Events

#### Queue Monitoring
```javascript
// Monitor queue events
generationQueue.on('wait', (job) => {
  console.log(`Job ${job.id} is waiting`);
});

generationQueue.on('active', (job) => {
  console.log(`Job ${job.id} is active`);
});

generationQueue.on('progress', (job, progress) => {
  console.log(`Job ${job.id} progress: ${progress}%`);
  // Emit WebSocket event
  io.to(`job_${job.id}`).emit('progress', { progress });
});

generationQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

generationQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});
```

#### Queue Dashboard
Access BullMQ dashboard at `http://localhost:3001` to monitor:
- Queue stats (active, waiting, completed, failed)
- Individual job details
- Failed job logs
- Job retry history

---

## Database Schema

### Collections

#### assignments
```typescript
{
  _id: ObjectId;
  title: string;
  subject: string;
  description: string;
  dueDate: Date;
  duration: number; // minutes
  totalMarks: number;
  questionConfig: {
    types: string[];
    totalQuestions: number;
    marksDistribution: Record<string, number>;
    difficultyRatio: Record<string, number>;
  };
  additionalInstructions?: string;
  customInstructions?: Record<string, string>;
  materials: Array<{
    fileId: string;
    fileName: string;
    type: 'pdf' | 'text';
    uploadedAt: Date;
  }>;
  createdBy: ObjectId; // User reference
  status: 'draft' | 'published' | 'archived';
  generatedPapers: ObjectId[]; // GeneratedPaper references
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
```javascript
db.assignments.createIndex({ createdBy: 1, createdAt: -1 });
db.assignments.createIndex({ status: 1 });
db.assignments.createIndex({ dueDate: 1 });
```

#### generated_papers
```typescript
{
  _id: ObjectId;
  assignmentId: ObjectId;
  title: string;
  totalMarks: number;
  duration: number;
  sections: Array<{
    id: string;
    title: string;
    instruction: string;
    questions: Array<{
      id: string;
      question: string;
      type: 'mcq' | 'short-answer' | 'essay';
      marks: number;
      difficulty: 'easy' | 'medium' | 'hard';
      options?: string[]; // For MCQ
    }>;
  }>;
  pdfUrl?: string;
  status: 'draft' | 'final' | 'published';
  generationJobId: ObjectId;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
```javascript
db.generated_papers.createIndex({ assignmentId: 1 });
db.generated_papers.createIndex({ status: 1 });
db.generated_papers.createIndex({ generatedAt: -1 });
```

#### generation_jobs
```typescript
{
  _id: ObjectId;
  assignmentId: ObjectId;
  paperId: ObjectId;
  jobId: string; // BullMQ job ID
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: string;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
```javascript
db.generation_jobs.createIndex({ jobId: 1 });
db.generation_jobs.createIndex({ status: 1 });
db.generation_jobs.createIndex({ assignmentId: 1 });
db.generation_jobs.createIndex({ createdAt: -1 });
```

#### users
```typescript
{
  _id: ObjectId;
  email: string;
  password: string; // hashed
  fullName: string;
  role: 'teacher' | 'admin' | 'student';
  institution?: string;
  avatar?: string;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
```javascript
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ createdAt: -1 });
```

---

## AI Generation Pipeline

### Prompt Architecture

#### System Prompt
```
You are an expert educational assessment designer. Generate high-quality exam questions that:
- Test core concepts and understanding
- Are clearly written and unambiguous
- Follow academic standards and best practices
- Match the specified difficulty levels
- Fit within the specified marks allocation

Generate ONLY valid JSON. No markdown, no explanations, no additional text.
```

#### User Prompt
```
Generate a comprehensive exam paper with these specifications:

Assignment: {title}
Subject: {subject}
Total Marks: {totalMarks}
Duration: {duration} minutes

Question Requirements:
- Total Questions: {totalQuestions}
- Types: {types} (e.g., MCQ, short-answer, essay)
- Marks Distribution: {marksDistribution}
- Difficulty Ratio: {difficultyRatio}

Based on this material:
{material}

Additional Instructions:
{additionalInstructions}

Generate the exam paper in this exact JSON structure:
{jsonSchema}

Return ONLY the JSON object, nothing else.
```

### Response Parsing

```typescript
interface AIResponse {
  title: string;
  totalMarks: number;
  sections: Section[];
}

interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

interface Question {
  id: string;
  question: string;
  type: 'mcq' | 'short-answer' | 'essay';
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  options?: string[];
}

// Parser with validation
function parseAIResponse(rawResponse: string): AIResponse {
  try {
    // Extract JSON from response
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    validateSchema(parsed);
    
    // Enrich with IDs and timestamps
    const enriched = enrichPaper(parsed);
    
    return enriched;
  } catch (error) {
    logger.error('Parse failed:', error);
    throw new ParseError('Failed to parse AI response');
  }
}

function validateSchema(data: any): void {
  if (!data.title) throw new Error('Missing title');
  if (!Array.isArray(data.sections)) throw new Error('Missing sections');
  
  data.sections.forEach((section: any, idx: number) => {
    if (!section.questions) throw new Error(`Section ${idx} missing questions`);
    section.questions.forEach((q: any, qIdx: number) => {
      if (!q.question || !q.marks || !q.difficulty) {
        throw new Error(`Section ${idx} Question ${qIdx} incomplete`);
      }
    });
  });
}
```

### Error Handling

```typescript
enum GenerationError {
  PROMPT_BUILD_FAILED = 'PROMPT_BUILD_FAILED',
  LLM_TIMEOUT = 'LLM_TIMEOUT',
  LLM_RATE_LIMITED = 'LLM_RATE_LIMITED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  PARSE_FAILED = 'PARSE_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

async function generateWithFallback(
  config: GenerationConfig,
  material?: string
): Promise<AIResponse> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await callLLM(buildPrompt(config, material));
      return parseAIResponse(response);
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        logger.error(`Generation failed after ${MAX_RETRIES} attempts:`, error);
        throw error;
      }
      
      // Exponential backoff
      await delay(1000 * Math.pow(2, attempt - 1));
    }
  }
}
```

---

## Deployment Guide

### Frontend Deployment (Vercel)

#### 1. Connect Repository
```bash
# Install Vercel CLI
npm install -g vercel

# Link project
cd apps/frontend
vercel
```

#### 2. Environment Variables (Vercel Dashboard)
```
NEXT_PUBLIC_API_URL=https://api.vedaai.com
NEXT_PUBLIC_WEBSOCKET_URL=https://api.vedaai.com
NEXT_PUBLIC_ENV=production
```

#### 3. Build Configuration
Vercel auto-detects Next.js. Default settings work fine.

#### 4. Deploy
```bash
vercel --prod
```

Access at your Vercel domain (auto-generated or custom).

### Backend Deployment (Railway)

#### 1. Connect Repository
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link
railway login
railway init
```

#### 2. Create Services

**PostgreSQL (Alternative to MongoDB)**
- Railway Dashboard → New Service → PostgreSQL
- Copy connection string

**Redis**
- Railway Dashboard → New Service → Redis
- Copy connection string

#### 3. Set Environment Variables (Railway Dashboard)

```
NODE_ENV=production
PORT=3000
MONGODB_URI=<mongodb-atlas-uri>
REDIS_URL=<upstash-redis-url>
JWT_SECRET=<generate-secure-secret>
OPENAI_API_KEY=<your-api-key>
FRONTEND_URL=https://vedaai.vercel.app
```

#### 4. Deploy
```bash
railway up
```

#### 5. Get Production URL
```bash
railway status
# Copy the public URL
```

### Database Setup (MongoDB Atlas)

#### 1. Create Cluster
```bash
# Go to mongodb.com/atlas
# Create free tier cluster
# Select US region
```

#### 2. Create Database User
```
Username: vedaai-prod
Password: Generate strong password
Role: Read/Write to any database
```

#### 3. Whitelist IP
```
Network Access → Add IP Address
Current IP or 0.0.0.0/0 (less secure)
```

#### 4. Get Connection String
```
Databases → Connect → Copy connection string
Format: mongodb+srv://user:pass@cluster.mongodb.net/vedaai?retryWrites=true
```

### Redis Setup (Upstash)

#### 1. Create Database
```bash
# Go to upstash.com
# Create Redis database
# Select US region
```

#### 2. Get Connection Details
```
Connection → Copy connection URL (HTTPS format)
Appears as: https://user:password@region.upstash.io
```

#### 3. Update Backend
```env
UPSTASH_REDIS_URL=<copied-url>
```

### Production Checklist

- [ ] SSL certificates configured (auto with Vercel/Railway)
- [ ] CORS properly configured
- [ ] Environment variables set on both services
- [ ] Database backups enabled (MongoDB Atlas auto-backup)
- [ ] Redis persistence enabled (Upstash auto-backup)
- [ ] Rate limiting configured
- [ ] Error monitoring setup (Sentry/LogRocket)
- [ ] Analytics configured (Google Analytics/Mixpanel)
- [ ] Email notifications configured
- [ ] CDN for static assets (Vercel handles this)
- [ ] Database indexing completed
- [ ] Queue monitoring dashboard accessible
- [ ] Health checks passing
- [ ] Load testing completed
- [ ] Security audit completed

---

## Testing Strategy

### Unit Tests

**Backend Services**
```bash
cd apps/backend
npm run test -- services
```

Example test:
```typescript
// services/generationService.test.ts
describe('GenerationService', () => {
  describe('buildPrompt', () => {
    it('should create prompt with correct structure', () => {
      const config = { questionCount: 25, /* ... */ };
      const prompt = buildPrompt(config);
      
      expect(prompt).toContain('25 questions');
      expect(prompt).toContain('JSON');
    });
  });
  
  describe('parseResponse', () => {
    it('should parse valid AI response', () => {
      const response = { /* valid JSON */ };
      const parsed = parseResponse(response);
      
      expect(parsed.sections).toHaveLength(4);
      expect(parsed.totalMarks).toBe(100);
    });
  });
});
```

### Integration Tests

**API Routes**
```bash
cd apps/backend
npm run test -- integration
```

Example test:
```typescript
// routes/assignments.test.ts
describe('POST /assignments', () => {
  it('should create assignment and queue generation', async () => {
    const response = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${token}`)
      .send(assignmentData);
    
    expect(response.status).toBe(201);
    expect(response.body.data.id).toBeDefined();
    
    // Verify job queued
    const job = await getQueuedJob();
    expect(job.data.assignmentId).toBe(response.body.data.id);
  });
});
```

### E2E Tests

**Complete User Flow**
```bash
cd apps/frontend
npm run test:e2e
```

Example test:
```typescript
// e2e/assignment-creation.spec.ts
import { test, expect } from '@playwright/test';

test('Complete assignment creation and generation flow', async ({ page }) => {
  // Navigate to create page
  await page.goto('/assignments/create');
  
  // Fill form
  await page.fill('input[name="title"]', 'Data Structures Test');
  await page.fill('input[name="totalMarks"]', '100');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Verify generation started
  await expect(page.locator('text=Generating')).toBeVisible();
  
  // Wait for completion
  await page.waitForSelector('text=Generation Complete', { timeout: 30000 });
  
  // Verify output
  const output = await page.locator('[data-testid="output-paper"]');
  await expect(output).toContainText('Data Structures Test');
});
```

### Running All Tests

```bash
# Backend
cd apps/backend
npm run test          # All tests
npm run test:watch   # Watch mode
npm run test:coverage

# Frontend
cd apps/frontend
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:coverage
```

---

## Performance Optimization

### Frontend Optimization

#### Code Splitting
```typescript
// pages/assignments/[id].tsx
import dynamic from 'next/dynamic';

const AssignmentOutput = dynamic(() => import('@/components/output/AssignmentOutput'), {
  loading: () => <LoadingSkeleton />,
  ssr: false
});
```

#### Image Optimization
```typescript
import Image from 'next/image';

<Image
  src="/exam-preview.png"
  alt="Exam Preview"
  width={1200}
  height={800}
  priority
  quality={75}
/>
```

#### Memoization
```typescript
import { memo } from 'react';

const QuestionCard = memo(({ question }) => {
  return <div>{question.text}</div>;
});

export default QuestionCard;
```

#### WebSocket Optimization
```typescript
// Only subscribe when needed
useEffect(() => {
  socket.emit('generation:subscribe', { jobId });
  
  return () => {
    socket.emit('generation:unsubscribe', { jobId });
  };
}, [jobId]);
```

### Backend Optimization

#### Database Query Optimization
```typescript
// Use lean() for read-only queries
const assignments = await Assignment
  .find({ createdBy: userId })
  .lean()
  .sort({ createdAt: -1 })
  .limit(10);

// Use select() to limit fields
const papers = await GeneratedPaper
  .find({ assignmentId })
  .select('title totalMarks generatedAt')
  .limit(5);
```

#### Caching Strategy
```typescript
// Cache frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedAssignment(id: string) {
  if (cache.has(id)) {
    const { data, timestamp } = cache.get(id);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  
  const data = await Assignment.findById(id);
  cache.set(id, { data, timestamp: Date.now() });
  return data;
}
```

#### Queue Optimization
```typescript
// Batch process PDFs
const pdfQueue = new Queue('pdfQueue', {
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});
```

---

## Troubleshooting

### Common Issues

#### WebSocket Connection Fails
```
Error: Connection refused
```

**Solutions:**
1. Check backend is running: `curl http://localhost:5000/health`
2. Verify CORS configuration in backend
3. Check firewall settings
4. Ensure `NEXT_PUBLIC_WEBSOCKET_URL` is correct

#### MongoDB Connection Error
```
MongoParseError: Invalid connection string
```

**Solutions:**
1. Verify connection string format
2. Check IP whitelist in MongoDB Atlas
3. Confirm database user credentials
4. Try `mongodb+srv://` protocol

#### LLM API Errors
```
401 Unauthorized - Invalid API key
429 Rate Limited
```

**Solutions:**
1. Verify API key in `.env.local`
2. Check API key has correct permissions
3. Implement request queuing for rate limiting
4. Use fallback LLM provider

#### PDF Generation Timeout
```
Error: Timeout waiting for Puppeteer
```

**Solutions:**
1. Increase timeout: `timeout: 30000`
2. Check system resources (RAM, CPU)
3. Add PDF to separate queue with fewer workers
4. Implement PDF streaming instead of buffering

### Debug Mode

**Backend**
```bash
DEBUG=vedaai:* npm run dev
```

**Frontend**
```bash
NEXT_PUBLIC_DEBUG=true npm run dev
```

**Queue Monitoring**
```bash
npm run bull:dashboard
# Visit http://localhost:3001
```

---

## Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Follow code style: `npm run lint`
3. Write tests: `npm run test`
4. Commit with conventional commit: `git commit -m "feat: description"`
5. Push and open PR

### Code Style

```bash
# Format code
npm run format

# Lint TypeScript
npm run lint

# Run type check
npm run type-check
```

### Pull Request Process

1. Update README if needed
2. Add tests for new features
3. Ensure CI passes
4. Request review from team
5. Merge after approval

---

## Security Considerations

### Input Validation
- Always validate file uploads (size, type)
- Sanitize prompt input to prevent injection
- Use Zod for schema validation

### Database Security
- Use MongoDB IP whitelist
- Enable authentication on Redis
- Regular backups (auto-enabled on Atlas)

### API Security
- Enable HTTPS in production
- Implement rate limiting
- Use secure JWT secrets (min 32 chars)
- CORS whitelist only trusted origins

### File Upload Security
```typescript
const ALLOWED_TYPES = ['application/pdf', 'text/plain'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

if (!ALLOWED_TYPES.includes(file.mimetype)) {
  throw new Error('Invalid file type');
}

if (file.size > MAX_SIZE) {
  throw new Error('File too large');
}
```

---

## License

MIT License - See LICENSE file for details

---

## Support

**Issues & Bug Reports:** [GitHub Issues](https://github.com/yourusername/vedaai/issues)

**Documentation:** [Full Docs](./docs)

**Email:** support@vedaai.com

---

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Answer key generation
- [ ] Automated grading
- [ ] Student progress tracking
- [ ] Teacher analytics dashboard
- [ ] Exam scheduling system
- [ ] Plagiarism detection
- [ ] Multi-language support
- [ ] Offline mode
- [ ] Integration with Learning Management Systems (LMS)

---

**Built with ❤️ by the VedaAI Team**

Last Updated: March 2024

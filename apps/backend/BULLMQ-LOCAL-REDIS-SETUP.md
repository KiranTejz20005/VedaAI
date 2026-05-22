# BullMQ + Local Redis Setup (Windows)

## Why Local Redis?

BullMQ requires **local Redis** because it depends on **blocking commands** (`BLPOP`, `BRPOPLPUSH`, etc.) for reliable job processing. Upstash serverless Redis does **not** support blocking commands, causing:

| Symptom | Root Cause |
|---------|-----------|
| Stalled jobs | Worker can't renew lock via blocking pop |
| Failed heartbeats | No persistent TCP connection |
| Lock corruption | BullMQ can't extend locks during AI calls |
| Infinite frontend polling | Worker never signals completion |
| Queue freeze | BullMQ can't recover from transient errors |

## Architecture After Migration

```
Frontend (React + Socket.IO)
    │
    ▼
Backend API (Express)
    │
    ├── MongoDB (persistence)
    │
    ├── BullMQ Queue (generation + pdf)
    │       │
    │       ▼
    ├── LOCAL REDIS (localhost:6379)  ← BullMQ ONLY
    │       │
    │       ▼
    ├── BullMQ Workers (AI + PDF)
    │       │
    │       ▼
    ├── AI Providers (NVIDIA, OpenAI, etc.)
    │       │
    │       ▼
    └── GeneratedPaper → Socket.IO → Frontend
```

## Redis Installation on Windows

### Option 1: Portable Redis (Recommended — Already Installed)

Redis 5.0.14.1 is installed at `../../redis-local/` and registered as a Windows service.

**Service management:**
```powershell
# View service status
Get-Service RedisLocal

# Start / Stop / Restart
Start-Service RedisLocal
Stop-Service RedisLocal
Restart-Service RedisLocal

# Set startup type (already Automatic)
Set-Service RedisLocal -StartupType Automatic
```

**Connection:** `redis://127.0.0.1:6379` (no password, no TLS)

### Option 2: Memurai (Windows-Native, Recommended for Production)

Memurai is a Redis-compatible server for Windows. Install via:

```powershell
# Via winget
winget install --id Memurai.MemuraiDeveloper

# Or download from https://www.memurai.com/
```

**Pros:** Native Windows, auto-start service, Redis 7.2 compatible
**Cons:** Developer edition free (production requires license)

### Option 3: WSL2 + Ubuntu + Redis

```powershell
# Install WSL2
wsl --install -d Ubuntu

# In WSL terminal:
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis
sudo systemctl start redis
```

**Pros:** Matches production Linux environment
**Cons:** Network overhead, WSL2 memory usage, requires WSL2 installation

### Option 4: Docker Desktop

```powershell
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

**Pros:** Version control, easy restart, widely used
**Cons:** Requires Docker Desktop, resource overhead

## Verifying Redis

```powershell
# Using redis-cli (in redis-local directory)
& ".\redis-local\redis-cli.exe" ping
# → PONG

# Check server info
& ".\redis-local\redis-cli.exe" INFO server
```

## BullMQ Architecture

### Queues

| Queue | Purpose | Concurrency | Lock Duration |
|-------|---------|-------------|---------------|
| `generation` | AI paper generation | 2 | 180s |
| `pdf` | PDF rendering | 2 | 120s |

### Worker Lifecycle

```
1. Queue receives job → Worker picks up via BLPOP
2. Worker acquires lock (prevents double-processing)
3. Worker processes job (AI generation, PDF rendering)
4. Worker extends lock periodically via heartbeat
5. Worker completes → emits event → releases lock
6. If worker crashes → lock expires → stalled job detector retries
```

### Configured Worker Options

| Option | AI Worker | PDF Worker | Purpose |
|--------|-----------|------------|---------|
| `lockDuration` | 180,000ms | 120,000ms | Max job processing time before stall detection |
| `stalledInterval` | 120,000ms | 60,000ms | How often to check for stalled jobs |
| `drainDelay` | 1,000ms | 1,000ms | Poll interval when queue is empty |
| `concurrency` | 2 | 2 | Max parallel jobs per worker |
| `limiter` | 5/min | — | Rate limit for AI API calls |

## Queue Lifecycle

```
enqueue → waiting → active → completed
                        ↘ failed → retry (exponential backoff)
                                    ↘ max retries → dead-letter
```

**Retry policy:**
- Generation: 2 attempts, exponential backoff (5s base)
- PDF: 2 attempts, fixed delay (3s)

## Diagnostics & Monitoring

### Health Endpoint

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "bullmq": {
    "redis": {
      "status": "connected",
      "url": "redis://localhost:6379",
      "connectCount": 1,
      "reconnectCount": 0,
      "errorCount": 0,
      "lastError": null
    },
    "workers": {
      "ai": { "active": true, "activeJobs": 0, "stalledJobs": 0 },
      "pdf": { "active": true }
    },
    "queues": {
      "generation": { "waiting": 0, "active": 0, "failed": 0, "completed": 0, "delayed": 0 },
      "pdf": { "waiting": 0, "active": 0, "failed": 0, "completed": 0, "delayed": 0 }
    }
  }
}
```

### Runtime Log Tags

| Tag | Source | Purpose |
|-----|--------|---------|
| `[REDIS:BullMQ]` | `redis.ts` | Connection lifecycle |
| `[WORKER:START]` | `aiGeneration.worker.ts` | Job start |
| `[WORKER:COMPLETE]` | `aiGeneration.worker.ts` | Job success |
| `[WORKER:FAIL]` | `aiGeneration.worker.ts` | Job failure |
| `[WORKER:STALL]` | `aiGeneration.worker.ts` | Stalled job detected |
| `[WORKER:EVENT]` | `aiGeneration.worker.ts` | Worker lifecycle events |
| `[QUEUE:EVENT]` | `app.ts` (QueueEvents) | Queue job events |
| `[STALL:STATUS]` | `app.ts` | Periodic stall monitor |
| `[WATCHDOG]` | `app.ts` | Queue timeout sweep |

## Troubleshooting

### Redis won't start

```powershell
# Check if port 6379 is in use
netstat -ano | findstr :6379

# Check Redis service status
Get-Service RedisLocal

# View Redis logs
Get-EventLog -LogName Application -Source "Redis" -Newest 10
```

### BullMQ workers not processing

1. **Check Redis is running:** `& ".\redis-local\redis-cli.exe" ping`
2. **Check health endpoint:** `GET /health` → `bullmq.redis.status`
3. **Check worker logs:** Search for `[WORKER:START]` and `[WORKER:FAIL]`
4. **Check queue depth:** `GET /health` → `bullmq.queues.generation.waiting`
5. **Verify BullMQ Redis URL:** `REDIS_BULLMQ_URL=redis://localhost:6379` in `.env`

### Stalled jobs

Stalled jobs mean BullMQ detected a worker holding a lock without heartbeating.
This should NOT happen with local Redis. If it does:

1. Check `lockDuration` is longer than max AI generation time (currently 180s)
2. Check `stalledInterval` (currently 120s — don't set lower than 30s)
3. Monitor `[WORKER:STALL]` logs

### Worker restart corruption

During graceful shutdown, workers are drained with a 30s timeout.
If a worker is killed forcefully, BullMQ's stalled job detector recovers after `stalledInterval`.

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `REDIS_URL` | Yes | — | General Redis (Upstash, caching only) |
| `REDIS_BULLMQ_URL` | No | `redis://localhost:6379` | BullMQ Redis (MUST be local) |

**WARNING:** Never set `REDIS_BULLMQ_URL` to an Upstash URL. The code now forces BullMQ to use `REDIS_BULLMQ_URL` unconditionally — no fallback to Upstash.

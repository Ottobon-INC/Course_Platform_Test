# Task 2: Async Queue Implementation — Summary & Verification

## Objective

Decouple AI processing from the HTTP request lifecycle to fix the **"Blocking Crisis"** — where every AI chatbot query held an HTTP connection open for 5–8 seconds while waiting for OpenAI. The solution uses a **Postgres-native job queue** (zero new infrastructure) to implement an asynchronous "Fire-and-Forget" pattern.

### Scope: Features Migrated

| Feature | Job Type | Auth | Status |
|---|---|---|---|
| ✅ **Course Player Chatbot** | `AI_QUERY` | Authenticated (JWT) | **Async** |
| ✅ **Landing Page Chatbot** | `LANDING_QUERY` | Public (no auth) | **Async** |

---

## Architectural Change

### Before (Synchronous)
```
User → POST /query → await processUserQuery() [5-8s blocking] → 200 OK {answer}
```

### After (Asynchronous)
```
User → POST /query → validate → enqueue job → 202 Accepted {jobId}  [<100ms]
                                     ↓
                              Worker polls queue
                                     ↓
                         processUserQuery() runs in background
                                     ↓
                         Job marked COMPLETED with result
                                     ↓
User → GET /job/:jobId → 200 OK {status: "COMPLETED", result: {answer}}
```

---

## Files Created / Modified

### Phase 1: Infrastructure

| Action | File | Purpose |
|---|---|---|
| NEW | `prisma/schema.prisma` (modified) | Added `BackgroundJobStatus` enum + `BackgroundJob` model |
| NEW | `System design issue refactoring docs/background_jobs_migration.sql` | Raw SQL for manual execution in Supabase |
| NEW | `backend/src/services/jobQueueService.ts` | Queue primitives: `enqueueJob`, `claimNextJob`, `completeJob`, `failJob`, `recoverStaleJobs`, `getJobById` |

### Phase 2: Wiring (Course Player Chatbot)

| Action | File | Purpose |
|---|---|---|
| NEW | `backend/src/workers/aiWorker.ts` | Background polling loop (1s interval), calls `processUserQuery()` |
| REWRITTEN | `backend/src/routes/assistant.ts` | `POST /query` → 202 async; new `GET /job/:jobId` polling endpoint |
| MODIFIED | `backend/src/server.ts` | Worker starts on boot, stops on shutdown |

### Phase 3: Landing Page Chatbot Migration

| Action | File | Purpose |
|---|---|---|
| REWRITTEN | `backend/src/routes/landingAssistant.ts` | `POST /query` → 202 async; new `GET /job/:jobId` polling endpoint (public, no auth) |
| MODIFIED | `backend/src/workers/aiWorker.ts` | Added `LANDING_QUERY` handler — calls `getLandingResouceContext()` + `generateLandingPageAnswer()` |

----

## Key Design Decisions

1. **Zero new infrastructure** — No Redis or BullMQ. Uses a Postgres table (`background_jobs`) as the job queue.
2. **Concurrency safety** — `SELECT FOR UPDATE SKIP LOCKED` prevents two workers from claiming the same job.
3. **Stale lock recovery** — Jobs stuck in `PROCESSING` for >5 minutes are automatically reset to `PENDING`.
4. **Retry logic** — Failed jobs retry up to `max_attempts` (default: 3) before being permanently marked `FAILED`.
5. **Suggestion bypass** — Pre-composed suggestion answers skip the queue entirely (no LLM call needed).
6. **Zero code duplication** — The worker calls the same `processUserQuery()` we extracted in Task 1.
7. **Landing Page stays public** — No authentication required. Uses an anonymous `userId` (`00000000-...`) for the job row.
8. **Generic worker, multiple job types** — A single polling loop handles both `AI_QUERY` and `LANDING_QUERY` via a `jobType` switch.

---

## Verification Results

### Course Player Chatbot

### Test 1: Enqueue (202 Accepted)

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:4000/api/assistant/query" `
  -Method POST `
  -Headers @{Authorization="Bearer <JWT>"; "Content-Type"="application/json"} `
  -Body '{"courseId":"f26180b2-...","topicId":"3aed48a9-...","question":"What is polymorphism?","moduleNo":1}'
```

**Result**: ✅ Returned `202 Accepted` with `jobId` and `sessionId` instantly.

### Test 2: Worker Processing + Poll (COMPLETED)

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/assistant/job/$($response.jobId)" `
  -Headers @{Authorization="Bearer <JWT>"}
```

**Result**: ✅ Returned `status: COMPLETED` with the AI-generated answer.

```
jobId                                status    result
-----                                ------    ------
895f5f41-1785-48ad-bd26-3bf09f9df771 COMPLETED @{answer=I don't have…
```

### Test 3: TypeScript Compilation

```powershell
npx tsc --noEmit
```

**Result**: ✅ Zero errors.

### Landing Page Chatbot

### Test 4: Landing Enqueue (202 Accepted — Public, No Auth)

```powershell
$r = Invoke-RestMethod -Uri "http://localhost:4000/api/landing-assistant/query" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"question":"What courses do you offer?"}'
```

**Result**: ✅ Returned `202 Accepted` with `jobId` instantly.

```
jobId                                status  message
-----                                ------  -------
84e105ed-838e-43a3-b6c9-7ab0cc0bdfa3 PENDING Your question has been queued for processing.
```

### Test 5: Landing Poll — PROCESSING → COMPLETED

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/landing-assistant/job/$($r.jobId)"
```

**First Poll Result**: `PROCESSING` (worker actively calling OpenAI)

**Second Poll Result**: ✅ `COMPLETED` with the AI-generated answer.

```
jobId                                status    result
-----                                ------    ------
84e105ed-838e-43a3-b6c9-7ab0cc0bdfa3 COMPLETED @{answer=We offer a variety of courses, including "Advanced JavaScript…
```

---

## Current Async Migration Scorecard

| Feature | Status | Job Type |
|---|---|---|
| ✅ Course Player Chatbot | **Async** | `AI_QUERY` |
| ✅ Landing Page Chatbot | **Async** | `LANDING_QUERY` |
| ❌ Tutor Copilot | Sync (blocking) | — |
| ❌ Persona Classification | Sync (blocking) | — |

---

## Conclusion

The "Blocking Crisis" is resolved for the two highest-impact features. User requests now return in <100ms, while AI processing runs asynchronously in the background. The Tutor Copilot and Persona Classification remain synchronous for now but can be migrated using the same `enqueueJob()` pattern with minimal effort. The architecture supports horizontal scaling (multiple workers) and is extensible to other job types (`GENERATE_PDF`, `SEND_EMAIL`, etc.) without schema changes.

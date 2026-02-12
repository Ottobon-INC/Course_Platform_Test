# Polling → Server-Sent Events (SSE) Migration

> **Date:** 2026-02-12  
> **Scope:** Course Player chatbot + Landing Page chatbot  
> **Status:** ✅ Completed

---

## Table of Contents

1. [Background: The Async Job Queue](#1-background-the-async-job-queue)
2. [What is Polling?](#2-what-is-polling)
3. [Why Polling Was Causing Delay](#3-why-polling-was-causing-delay)
4. [The Solution: Server-Sent Events (SSE)](#4-the-solution-server-sent-events-sse)
5. [Why SSE Over WebSockets?](#5-why-sse-over-websockets)
6. [Architecture Before & After](#6-architecture-before--after)
7. [Implementation Details](#7-implementation-details)
8. [Files Changed](#8-files-changed)
9. [Additional Bug Fixes (Same Session)](#9-additional-bug-fixes-same-session)

---

## 1. Background: The Async Job Queue

The application has two AI-powered chatbots:

| Chatbot | Location | Auth | Backend Route |
|---|---|---|---|
| **Course Player Tutor** | `CoursePlayerPage.tsx` | Bearer token (authenticated) | `POST /assistant/query` |
| **Landing Page Guide** | `LandingChatBot.tsx` | None (anonymous) | `POST /api/landing-assistant/query` |

Both chatbots were recently migrated from a **synchronous** architecture (where the Express route called the AI inline and blocked the thread for 5–10 seconds) to an **asynchronous job queue**:

```
Client  →  POST /query  →  Enqueue job in Postgres  →  Return 202 { jobId }
                                     ↓
                              Background Worker polls for jobs
                                     ↓
                              Worker calls OpenAI / RAG pipeline
                                     ↓
                              Worker writes result to job row
```

The async refactor fixed the **server-blocking crisis** (a single AI call could starve all other HTTP requests for 5–10 seconds), but it introduced a new problem: **how does the frontend get the result?**

The initial answer was **polling**.

---

## 2. What is Polling?

**Polling** is when the frontend repeatedly sends HTTP requests at fixed intervals to check if the backend has finished processing.

```
Frontend                          Backend
   │                                 │
   ├── POST /query ─────────────────►│  (enqueue job)
   │◄── 202 { jobId } ──────────────┤
   │                                 │
   │  (wait 1.5s)                    │
   ├── GET /job/abc ────────────────►│  → { status: "PROCESSING" }
   │◄── 200 ─────────────────────────┤
   │                                 │
   │  (wait 1.5s)                    │
   ├── GET /job/abc ────────────────►│  → { status: "PROCESSING" }
   │◄── 200 ─────────────────────────┤
   │                                 │
   │  (wait 1.5s)                    │
   ├── GET /job/abc ────────────────►│  → { status: "PROCESSING" }
   │◄── 200 ─────────────────────────┤
   │                                 │
   │  (wait 1.5s)                    │   ← AI finishes at ~5.2 seconds
   ├── GET /job/abc ────────────────►│  → { status: "COMPLETED", result: {...} }
   │◄── 200 ─────────────────────────┤
   │                                 │
   └── Display answer               │
```

In the Course Player chatbot (`CoursePlayerPage.tsx`), the implementation was:

```typescript
// Old polling implementation (removed)
const POLL_INTERVAL = 1500;  // 1.5 seconds
const MAX_POLLS = 60;        // 90 second timeout
let polls = 0;
let jobDone = false;

while (!jobDone && polls < MAX_POLLS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    polls += 1;

    const pollRes = await fetch(`/assistant/job/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const pollData = await pollRes.json();

    if (pollData?.status === "COMPLETED") {
        answer = pollData.result.answer;
        jobDone = true;
    } else if (pollData?.status === "FAILED") {
        throw new Error(pollData.errorMessage);
    }
}
```

The Landing Page chatbot (`LandingChatBot.tsx`) had a worse problem — it was **never updated** for the async refactor and still expected a synchronous `{ answer }` response from the POST. Since the backend now returns `202 { jobId }`, the `data.answer` field was `undefined`, meaning the landing chatbot was **completely broken**.

---

## 3. Why Polling Was Causing Delay

### 3.1 Wasted Wait Time

The polling interval was 1.5 seconds. If the AI finishes processing at 2.1 seconds, the next poll fires at 3.0 seconds. The user waits **0.9 seconds for nothing**.

On average, polling adds **~750ms of pure latency** to every response (half the polling interval).

### 3.2 Unnecessary HTTP Overhead

Each poll is a full HTTP round-trip:

```
DNS lookup → TCP handshake → TLS → HTTP request → Server processing → HTTP response
```

For a typical 5-second AI response, the frontend fires **3–4 poll requests** — each one consuming:
- Browser connection pool slot
- Express thread time
- Database query (to read the job status)

### 3.3 Scale Problem

| Concurrent Users | Polls per User | Extra Requests (per batch) |
|---|---|---|
| 10 | 4 | 40 |
| 50 | 4 | 200 |
| 100 | 4 | **400** |

At 100 concurrent users, the server handles 400 unnecessary requests per batch — burning CPU on job-status lookups instead of serving real traffic.

### 3.4 Summary of Costs

| Issue | Quantified Impact |
|---|---|
| Added latency per response | ~750ms average |
| Extra HTTP requests per question | 3–5 |
| Server load at 100 users | 400 extra requests |
| Landing chatbot | **Completely broken** (never updated for async) |

---

## 4. The Solution: Server-Sent Events (SSE)

**SSE** is a browser-native protocol where the server holds one HTTP connection open and pushes events to the client as they happen. The client makes one request, and the server responds whenever it has data.

### New Flow

```
Frontend                          Backend
   │                                 │
   ├── POST /query ─────────────────►│  (enqueue job)
   │◄── 202 { jobId } ──────────────┤
   │                                 │
   ├── GET /stream/abc ─────────────►│  (SSE connection opened)
   │   (connection held open)        │
   │                                 │  Server polls DB every 500ms internally
   │◄── : heartbeat ────────────────┤  (keeps connection alive)
   │◄── : heartbeat ────────────────┤
   │                                 │  ← AI finishes at ~5.2 seconds
   │◄── event: completed ───────────┤  ← Result pushed INSTANTLY
   │   data: { answer, ... }        │
   │                                 │
   └── Display answer (connection closes)
```

### Key Difference

| Aspect | Polling | SSE |
|---|---|---|
| Requests per question | 4–5 | **1** |
| Average wasted latency | ~750ms | **~250ms** (server polls DB every 500ms) |
| HTTP overhead | Full round-trip per poll | Single persistent connection |
| Server load at 100 users | 400 extra requests | **0 extra requests** |
| Complexity | Simple but wasteful | Slightly more complex, much more efficient |

---

## 5. Why SSE Over WebSockets?

| Feature | SSE | WebSocket |
|---|---|---|
| **Direction** | Server → Client (one-way) | Bidirectional |
| **Our use case** | ✅ Wait for one result, then close | ❌ We don't stream client→server |
| **Complexity** | Simple HTTP, auto-reconnect built in | Requires upgrade handshake, ping/pong |
| **Infrastructure** | Works through all HTTP proxies/CDNs | May need special proxy configuration |
| **Browser support** | Native `EventSource` API | Native `WebSocket` API |
| **Auth headers** | ❌ `EventSource` can't send custom headers | ✅ Via upgrade handshake |

**Decision:** SSE is the right fit because our use case is strictly one-directional (server pushes result to client). WebSockets would be overkill.

**Auth workaround:** Since the `EventSource` API doesn't support custom headers like `Authorization: Bearer …`, we use the **Fetch API + ReadableStream** to consume the SSE stream. This gives us the SSE protocol benefits while allowing custom headers.

---

## 6. Architecture Before & After

### Before (Polling)

```
┌─────────────┐    POST /query     ┌─────────────┐    enqueue    ┌──────────┐
│   Frontend  │ ──────────────────►│   Express   │ ─────────────►│ Postgres │
│             │◄── 202 { jobId } ──│   Route     │               │ Job Row  │
│             │                    └─────────────┘               └──────────┘
│             │                                                       │
│             │    GET /job/:id     ┌─────────────┐                   │
│             │ ──────────────────►│   Express   │    SELECT         │
│             │◄── { PROCESSING } ─│   Route     │◄──────────────────┘
│             │                    └─────────────┘
│             │    (repeat 3-5x)         ...
│             │
│             │    GET /job/:id     ┌─────────────┐    SELECT    ┌──────────┐
│             │ ──────────────────►│   Express   │ ────────────►│ Postgres │
│             │◄── { COMPLETED } ──│   Route     │◄── result ───│ Job Row  │
└─────────────┘                    └─────────────┘               └──────────┘
```

### After (SSE)

```
┌─────────────┐    POST /query     ┌─────────────┐    enqueue    ┌──────────┐
│   Frontend  │ ──────────────────►│   Express   │ ─────────────►│ Postgres │
│             │◄── 202 { jobId } ──│   Route     │               │ Job Row  │
│             │                    └─────────────┘               └──────────┘
│             │                                                       │
│             │  GET /stream/:id   ┌─────────────┐                    │
│             │ ──────────────────►│   SSE       │   internal poll    │
│             │   (held open)      │   Handler   │   every 500ms     │
│             │◄── : heartbeat ────│             │◄───────────────────┘
│             │◄── : heartbeat ────│             │
│             │◄── completed ──────│             │◄── result found!
└─────────────┘   (connection      └─────────────┘
                   closes)
```

---

## 7. Implementation Details

### 7.1 Backend: SSE Stream Handler (`sseStream.ts`)

**File:** `backend/src/routes/sseStream.ts`

A shared Express handler used by both the Course Player and Landing Page routes.

**How it works:**

1. Validates the `jobId` parameter (UUID format)
2. Sets SSE response headers:
   ```
   Content-Type: text/event-stream
   Cache-Control: no-cache
   Connection: keep-alive
   X-Accel-Buffering: no          ← disables Nginx buffering
   ```
3. Starts an internal poll loop (every 500ms) that checks the job status in the database
4. Sends SSE events based on job status:
   - `event: completed` + `data: { answer, sessionId, ... }` — job succeeded
   - `event: failed` + `data: { error }` — job failed
   - `event: timeout` + `data: {}` — 90 second timeout reached
   - `: heartbeat` — SSE comment to keep the connection alive (ignored by parsers)
5. Cleans up immediately if the client disconnects (`req.on("close")`)

**SSE Event Format (per the spec):**
```
event: completed
data: {"answer":"HTML stands for...","sessionId":"abc-123"}

```
*(Events are terminated by a blank line `\n\n`)*

### 7.2 Backend: Route Registration

**Course Player** (`assistant.ts`):
```typescript
import { handleJobStream } from "./sseStream";
assistantRouter.get("/stream/:jobId", requireAuth, handleJobStream);
```

**Landing Page** (`landingAssistant.ts`):
```typescript
import { handleJobStream } from "./sseStream";
landingAssistantRouter.get("/stream/:jobId", handleJobStream);
```

Note: The Course Player route includes `requireAuth` middleware; the Landing Page route does not (anonymous users).

### 7.3 Frontend: SSE Reader (`streamJob.ts`)

**File:** `frontend/src/lib/streamJob.ts`

A shared utility function used by both chatbot frontends.

**Why `fetch` + `ReadableStream` instead of `EventSource`:**

The native `EventSource` API does **not** support custom HTTP headers. The Course Player chatbot needs to send `Authorization: Bearer <token>`. Using `fetch` with a `ReadableStream` gives us SSE protocol benefits while allowing custom headers.

**How it works:**

1. Opens a `fetch` request to the SSE endpoint (with custom headers and credentials)
2. Reads the response body as a stream using `ReadableStream` + `TextDecoder`
3. Buffers incoming data and splits on `\n\n` (SSE event delimiter)
4. Parses each event block for `event:` and `data:` fields
5. Returns a `Promise<Record<string, unknown>>` that resolves when `completed` fires, or rejects on `failed`/`timeout`/`error`

```typescript
// Usage in CoursePlayerPage.tsx
const result = await streamJobResult(
    buildApiUrl(`/assistant/stream/${jobId}`),
    { Authorization: `Bearer ${session.accessToken}` },
);
answer = result?.answer as string;

// Usage in LandingChatBot.tsx (no auth needed)
const result = await streamJobResult(
    buildApiUrl(`/api/landing-assistant/stream/${data.jobId}`)
);
botText = result.answer as string;
```

### 7.4 Frontend: Course Player Chatbot Update

**File:** `frontend/src/pages/CoursePlayerPage.tsx`

**Before (30 lines):**
```typescript
const POLL_INTERVAL = 1500;
const MAX_POLLS = 60;
let polls = 0;
let jobDone = false;
while (!jobDone && polls < MAX_POLLS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    polls += 1;
    const pollRes = await fetch(`/assistant/job/${jobId}`, { ... });
    const pollData = await pollRes.json();
    if (pollData?.status === "COMPLETED") { ... jobDone = true; }
    else if (pollData?.status === "FAILED") { throw ... }
}
if (!jobDone) { throw new Error("timeout"); }
```

**After (5 lines):**
```typescript
const result = await streamJobResult(
    buildApiUrl(`/assistant/stream/${jobId}`),
    { Authorization: `Bearer ${session.accessToken}` },
);
answer = (result?.answer as string) ?? "I could not find an answer.";
sessionId = typeof result?.sessionId === "string" ? result.sessionId : undefined;
nextSuggestions = Array.isArray(result?.nextSuggestions) ? result.nextSuggestions : [];
```

### 7.5 Frontend: Landing Page Chatbot Fix

**File:** `frontend/src/components/LandingChatBot.tsx`

This chatbot was **completely broken** after the async refactor — it still expected a synchronous `{ answer }` response from the POST endpoint, but the backend now returns `202 { jobId }`.

**Fix:** Added 202 detection + SSE streaming:
```typescript
let result: Record<string, unknown>;
if (response.status === 202 && data.jobId) {
    // Async path — stream the result via SSE
    result = await streamJobResult(
        buildApiUrl(`/api/landing-assistant/stream/${data.jobId}`)
    );
} else {
    // Sync fallback (backward compatible)
    result = data;
}

let botText = (result.answer as string) || "";
```

---

## 8. Files Changed

### New Files

| File | Purpose |
|---|---|
| `backend/src/routes/sseStream.ts` | Shared SSE stream handler (server-side DB polling, event dispatch) |
| `frontend/src/lib/streamJob.ts` | Shared SSE reader (fetch + ReadableStream, custom header support) |

### Modified Files

| File | Change |
|---|---|
| `backend/src/routes/assistant.ts` | Added `import { handleJobStream }` and `GET /stream/:jobId` route (authenticated) |
| `backend/src/routes/landingAssistant.ts` | Added `import { handleJobStream }` and `GET /stream/:jobId` route (anonymous) |
| `frontend/src/pages/CoursePlayerPage.tsx` | Replaced 30-line polling `while` loop with 5-line `streamJobResult()` call |
| `frontend/src/components/LandingChatBot.tsx` | Added 202 detection, SSE streaming, and `streamJobResult` import (was broken) |

### Unchanged (Backward Compatible)

| File | Note |
|---|---|
| `backend/src/routes/assistant.ts` → `GET /job/:jobId` | Old polling endpoint kept for backward compatibility |
| `backend/src/routes/landingAssistant.ts` → `GET /job/:jobId` | Old polling endpoint kept for backward compatibility |
| `backend/src/workers/aiWorker.ts` | No changes needed — the SSE handler reads the same job rows |

---

## 9. Additional Bug Fixes (Same Session)

During this debugging session, three other bugs were identified and fixed:

### 9.1 Course Slug Update

The course slug `ai-in-web-development` was outdated and didn't match the actual course name "AI Native FullStack Developer".

**Fix:** Updated the slug to `ai-native-fullstack-developer` across **17 files** (frontend pages, backend routes, seed data, constants) and the `courses` table in Supabase. The old slug is preserved as a legacy alias in `courseResolutionService.ts` for backward compatibility.

### 9.2 RAG Response Failure (course_id Type Mismatch)

The chatbot was returning *"I don't have enough details in the course materials…"* for every question.

**Root cause:** The `course_chunks` table stored `course_id` as a slug (`ai-in-web-development`), but `fetchRelevantContexts()` queried it with a UUID (`f26180b2-...`) — resulting in zero vector search matches.

**Fix:**
1. Updated all 298 rows in `course_chunks` to store the UUID instead of the slug
2. Updated `ingestCourseContent.ts` to use the UUID as `DEFAULT_COURSE_ID` so future ingestions are consistent

### 9.3 Duplicate User Messages

The Express route in `assistant.ts` eagerly wrote the user's message to chat history *before* enqueuing the job, and `processUserQuery` in the worker also wrote the same message — resulting in duplicate user messages.

**Fix:** Removed the eager write from the route handler.

### 9.4 Stale Variable Reference

A `ReferenceError` in `CoursePlayerPage.tsx` where a telemetry call referenced `next` (old variable name) instead of `nextSuggestions` (renamed variable).

**Fix:** Updated the reference to `nextSuggestions.length`.

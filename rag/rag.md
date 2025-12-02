# RAG Assistant – Implementation Guide

This document explains every moving part of the Retrieval-Augmented Generation (RAG) assistant that powers the course player chatbot. It covers the data pipeline, backend routes, frontend wiring, and step‑by‑step instructions for ingestion, querying, and extending the system.

---

## 1. Overview

The MetaLearn assistant answers course-specific questions by retrieving authoritative content from Neo4j and composing mentor‑style responses with OpenAI. The high-level flow:

1. **Ingest** the course PDF into Neo4j, generating dense embeddings for each chunk.
2. **Serve** a protected `/assistant/query` endpoint in Express that validates the user, resolves course context, runs Neo4j vector search, builds a prompt, and calls OpenAI.
3. **Render** the chatbot UI in the course player, which authenticates users, streams questions to the endpoint, shows loading states, and displays the mentor response.

---

## 2. Environment & Dependencies

Add these to `backend/.env` (never commit real secrets):

```
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-3.5-turbo
EMBEDDING_MODEL=text-embedding-3-small
NEO4J_URI=neo4j+s://<your-instance>.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
```

Backend packages used for RAG:

- `openai` – chat completions + embeddings
- `neo4j-driver` – Aura connection & vector queries
- `pdf-parse` – extracts PDF text during ingestion
- `express-rate-limit` (custom rate limiter implemented manually) – per-user throttling

Frontend depends on the existing React/TanStack Query setup; no extra packages were required for the chatbot beyond the custom component.

---

## 3. Ingestion Pipeline

### 3.1 Script Location
`backend/scripts/ingestCourseContent.ts`

### 3.2 Responsibilities
1. Read the PDF (default `../Web Dev using AI Course Content.pdf`).
2. Chunk the text (`chunkText` helper under `src/rag/textChunker.ts`) with overlap to capture context.
3. Call OpenAI embeddings for each chunk (`createEmbedding` in `src/rag/openAiClient.ts`).
4. Upsert chunk nodes into Neo4j (`CourseChunk` label) via `replaceCourseChunks`:
   - Ensures vector index exists.
   - Removes previous chunks for the course.
   - Stores metadata (`chunkId`, `content`, `courseId`, `position`, `embedding`).
   - Connects chunks to a `Course` node.

### 3.3 Running the Script

```bash
cd backend
npm run rag:ingest "../Web Dev using AI Course Content.pdf" ai-in-web-development "AI in Web Development"
```

Arguments: `[pdfPath] [courseSlugOrId] [courseTitle]`. Defaults handle the AI Web Development course. Re-run the script whenever the course content changes. The `courseSlugOrId` value must match what the SPA passes to `/assistant/query` (currently the slug `ai-in-web-development`); otherwise Neo4j queries will return zero contexts.

---

## 4. Backend Architecture

### 4.1 RAG Modules (`backend/src/rag`)

- `neo4jClient.ts`: connection factory, vector index setup.
- `openAiClient.ts`: wrapper for embeddings and chat completions, enforcing model choice.
- `textChunker.ts`: normalizes plain text into overlapping chunks.
- `rateLimiter.ts`: small in-memory throttle keyed by user ID (8 requests/min).
- `pii.ts`: scrubs obvious emails/phone numbers before sending user text to OpenAI.
- `usageLogger.ts`: structured log of timestamp/user/status for auditability.
- `ragService.ts`: high-level orchestration for ingestion + query:
  - `replaceCourseChunks(courseTitle, chunks)` – ingestion helper.
  - `askCourseAssistant({ courseId, courseTitle, question, userId })`: runs vector search, builds a course-specific mentor prompt, and returns the final answer.

Important details:
- Vector search uses `CALL db.index.vector.queryNodes(...)` filtered by `courseId` with cosine similarity.
- The prompt enforces “3–6 sentences” and “use only provided contexts”.
- If no contexts are found, returns a polite fallback instead of hallucinating.

### 4.2 Express Route

`backend/src/routes/assistant.ts` exposes:

```
POST /assistant/query (also mirrored under /api/assistant/query)
Body:
  question: string (required)
  courseId: string (required)
  courseTitle?: string
```

Middleware:
- `requireAuth` – JWT-based, ensures the user is logged in.
- Rate limiter – throws HTTP 429 if the user exceeds the per-minute cap.
- Body validation – returns 400 on missing question/course ID.

On success, returns `{ answer: string }`. Errors (Neo4j/OpenAI/validation) bubble up with consistent messages and are logged via `[rag] {timestamp, userId, status}` for monitoring.

Remember to register the router in `src/app.ts` so `/assistant` routes are available both under the root and `/api` prefixes.

---

## 5. Frontend Integration

### 5.1 ChatBot Component – `frontend/src/components/ChatBot.tsx`

Key features:
- Floating action button opens/closes the assistant drawer.
- Loads/stores user session and disables input if the user isn’t authenticated or course context is missing.
- Maintains message history + loading state; scrolls automatically.
- Calls `requestAssistantAnswer` which uses `fetch(buildApiUrl('/assistant/query'))` with JWT bearer token from `localStorage`.
- Handles 401 (session expired) and 429 (rate limit) gracefully, showing descriptive toasts/messages.
- Shows a spinner while waiting for the backend and displays the mentor response on success.

### 5.2 CoursePlayerPage Wiring

At the bottom of `CoursePlayerPage.tsx`, we render:

```tsx
<ChatBot courseName={course?.title} courseId={courseId} />
```

This ensures the assistant always knows which course to scope results to and can display the course title in the header. The rest of the player already handles slug navigation, module layout, etc., and now the chat button reflects real answers.

### 5.3 UX Considerations
- The assistant toggle uses the new pill-style theme toggle (previous step) but any styling adjustments can be made within `ChatBot.tsx`.
- The component prevents empty submissions, keeps focus states accessible, and shows inline errors if the backend returns an issue.

---

## 6. Request Lifecycle (End-to-End)

1. **User opens the course player**  
   React renders `<ChatBot />` but the panel is closed by default.

2. **User clicks the assistant button and submits a question**  
   - `ChatBot` appends the user message locally.
   - Validates `courseId` + session presence.
   - Sends `POST /assistant/query` with `{ question, courseId, courseTitle }`.

3. **Backend receives the request**  
   - `requireAuth` extracts `userId` from the JWT.
   - Rate limiter ensures the user isn’t flooding the endpoint.
   - `askCourseAssistant`:
     1. Embeds the sanitized question via OpenAI.
     2. Queries Neo4j vector index for the top 5 `CourseChunk`s.
     3. Builds the mentor prompt using only those contexts.
     4. Calls OpenAI chat completion to craft a 3–6 sentence answer.
     5. Logs usage and returns `{ answer }`.

4. **Frontend receives the answer**  
   - Removes the “typing” indicator.
   - Appends the mentor text to the message list.
   - Input becomes active again so the user can ask follow-up questions.

5. **Follow-up Questions**  
   Each message cycles through the same flow, referencing the same course chunks. Since contexts are fetched fresh each time, the assistant remains grounded in the latest Neo4j data.

---

## 7. Error Handling & Safeguards

- **Missing session** – UI shows “Please sign in” and blocks the send button.
- **Rate limit (429)** – message prompts the user to wait before asking again.
- **Neo4j issues** – backend logs `[rag] fail` and returns a friendly error (“I don’t have enough details…” or “Couldn’t reach the assistant”). Frontend surfaces the message in the chat bubble.
- **PII scrubbing** – email/phone patterns are replaced before hitting OpenAI.
- **Logging** – each request logs `{ timestamp, userId, status }` to stdout; tie into your logging platform if desired.

---

## 8. Maintenance Checklist

1. **Secrets**
   - Keep `.env` files git-ignored.
   - Rotate `OPENAI_API_KEY` if ever leaked; update `.env` accordingly.
2. **Neo4j Index Health**
   - `ensureVectorIndex()` runs automatically during ingestion, but you can verify via Aura console if needed.
3. **Re-ingestion**
   - Run `npm run rag:ingest ...` any time the PDF or course content changes.
4. **Backend Availability**
   - `/assistant/query` depends on a healthy DB connection and valid JWT tokens. Monitor logs for `[rag] fail`.
5. **Frontend UI**
   - The chatbot is reused across the player; test different courses to ensure `courseId` is always passed.

---

## 9. Extending the System

- **Multiple Courses**: run the ingest script per course with unique `courseId`/slug. The Neo4j schema supports multiple `Course` nodes, each with its own chunk set.
- **Citations**: `askCourseAssistant` already returns chunk IDs/contents; augment the response to include context metadata if you want citation highlights.
- **Streaming Responses**: convert `/assistant/query` to a streaming endpoint (Server-Sent Events or fetch streaming) and update the chatbot to append tokens in real time.
- **Advanced Rate Limiting**: swap the in-memory throttle with Redis or a shared store if you scale horizontally.
- **Analytics**: send `[rag]` logs to your observability stack (Datadog, ELK, etc.) for usage dashboards.

---

## 10. Quick Reference Commands

```bash
# Install deps
cd backend && npm install

# Ingest AI Web Dev course PDF
npm run rag:ingest "../Web Dev using AI Course Content.pdf" ai-in-web-development "AI in Web Development"

# Start backend / frontend
npm run dev    # from backend/
npm run dev    # from frontend/
```

With this setup, MetaLearn’s chatbot now delivers contextual answers tied tightly to your course content—grounded, rate-limited, and ready for ongoing enhancements. Feel free to adapt the ingestion script or frontend UI for additional courses, languages, or UX tweaks.

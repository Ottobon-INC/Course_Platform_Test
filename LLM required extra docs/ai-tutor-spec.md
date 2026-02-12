# AI Tutor Spec (RAG + Memory + Quotas)

This spec captures the exact AI tutor pipeline used in `backend/src/routes/assistant.ts` + `backend/src/rag/*`.

## 1) Request entry points
- **Learner tutor**: `POST /assistant/query` (Enqueues job)
- **Result Stream**: `GET /stream/:jobId` (Server-Sent Events)
- **History hydration**: `GET /assistant/session` (Auth required)

## 2) Prompt types
**Typed prompt**
- `suggestionId` is **absent**.
- `moduleNo` is **required**.
- Counts against module prompt quota (`module_prompt_usage`).

**Suggested prompt (Sync)**
- `suggestionId` provided.
- Returns 200 immediately (if pre-calculated answer exists).
- Does **not** use job queue.

**Typed prompt (Async)**
- Enters `background_jobs` queue.
- Client receives `202 Accepted` with `jobId`.
- Client listens to SSE for completion.

## 3) Course + topic validation
- `courseId` is resolved via UUID, legacy alias, slug, or course name.
- `topicId` must be UUID and must belong to resolved course.
- If invalid: 400/404.

## 4) Quotas and rate limits
- **Typed prompt quota**: 5 per module (`PROMPT_LIMIT_PER_MODULE`).
- **Rate limit**: 8 requests per 60 seconds per user (`rateLimiter.ts`).
- Checks occur **before** job enqueue.
- Quota exceeded -> 429.

## 5) Chat session memory
- Session key: `(userId, courseId, topicId)`.
- Tables: `cp_rag_chat_sessions`, `cp_rag_chat_messages`.
- History loaded per request: last **10** turns (`CHAT_HISTORY_LIMIT`).
- Session load endpoint returns up to **40** messages (`CHAT_HISTORY_LOAD_LIMIT`).
- Summaries are generated when total messages >= **16** (`SUMMARY_MIN_MESSAGES`).
- Summary stores only older messages beyond the live window and updates `summaryMessageCount`.

## 6) Follow-up rewriting
- Triggered when:
  - Question length <= 80, and
  - It starts with a follow-up phrase or contains pronouns (`it`, `this`, etc.).
- Uses `rewriteFollowUpQuestion()` with last assistant message + summary.
- Output replaces `effectiveQuestion` if rewritten text is non-empty.

## 7) Retrieval and prompt assembly
- Text is scrubbed for basic PII (emails, phone numbers).
- `createEmbedding()` uses `EMBEDDING_MODEL` (default `text-embedding-3-small`).
- Vector search on `course_chunks` (pgvector): **topK = 5**, similarity = `1 - (embedding <=> query)`.
- Retrieval uses the raw `courseId` from the request body (not the resolved UUID), so `course_chunks.course_id` must match what the client sends.
- Prompt assembly:
  - Persona prompt (from `learner_persona_profiles`) if present.
  - Conversation summary (if any).
  - Recent conversation (last 10 turns).
  - Retrieved contexts.
  - User question.

## 8) LLM prompting rules
System prompt (answer):
- "You are MetaLearn's AI mentor. Answer with warmth and clarity using only the provided course material."

Response constraints (from prompt builder):
- Use provided contexts only.
- If not present, say you don't have that information.
- Respond in **3-6 sentences**.

Fallback if zero contexts:
- Returns: "I don't have enough details in the course materials to answer that..."

## 9) Stored outputs
Each query stores two messages:
- `role=user` (original user question)
- `role=assistant` (final answer)

Precomposed suggestion answers are also stored to chat history.

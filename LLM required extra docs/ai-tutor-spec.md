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

## Addendum - 2026-03-04 (No Previous Lines Removed)
- Verified current runtime architecture: one `frontend/` app and one `backend/` API in this repository.
- Verified async AI flow: request -> `background_jobs` queue -> `aiWorker` processing -> SSE response stream.
- Verified cohort access-state source endpoint: `GET /courses/:courseKey/access-status` returning `isAuthenticated`, `hasApplied`, `isApprovedMember`.
- Verified registration identity linkage: `POST /registrations` normalizes email and resolves/writes `registrations.user_id` using auth-user match or `users.email` lookup.
- Verified course details CTA progression for cohort flow: `Register Now` -> `Apply for Cohort` -> `Application is under review` -> `Start Learning`.


---

## Codebase Sync Addendum (2026-05-11)

This document has been synchronized with the current implementation state of the Course Platform codebase.
If any older section in this file conflicts with this addendum, treat this addendum as the latest behavior.

### Current implementation truths

1. API surface is exposed both at root routes and mirrored `/api/*` routes in the backend app bootstrap.
2. Assessment engine is `assessment_id`-centric:
   - Live assessment definitions are in `course_assessments`.
   - Topic/module assessment pointers are resolved from `topic_content_assets.payload.assessment_id`.
   - Attempt tracking uses `quiz_attempts.assessment_id` as canonical identity (legacy `topic_pair_index` is retained for compatibility paths).
3. Course Player Page supports topic-inline quiz rendering (`Topic Assessment`) when a quiz block exists in topic block JSON and its `contentKey` resolves to a quiz asset pointer.
4. Module-level assessment flow is resolved from module/topic-linked quiz pointers and assessment definitions; latest attempt status is derived per assessment.
5. Student Dashboard assignment flow is API-driven (`/api/assignments/learner`, `/api/assignments/upload`, `/api/assignments/submit`) and filtered by learner enrollments/cohort access.
6. Persona implementation is mixed by design in current code:
   - Backend persona services and tutoring prompts use five keys: `non_it_migrant`, `rote_memorizer`, `english_hesitant`, `last_minute_panic`, `pseudo_coder`.
   - A separate learner-path questionnaire flow still contains legacy persona labels (`sports`, `cooking`, `adventure`, `normal`) and should be treated as an independent path unless migrated.
7. Content loading supports both structured block JSON and legacy plain-text topic payloads; rendering/queries must account for both shapes.

### Operational documentation rule

When updating docs or onboarding teams, use backend route/service behavior and frontend page behavior in the running code as the source of truth over historical notes.

# Backend Development Log

## 2025-12-30
- **Cold calling backend** – added cold call tables and `/cold-call` endpoints for blind-response prompts, threaded replies, and star reactions scoped to cohort membership.

## 2025-12-29
- **Cohort allowlist tables** – added `cohorts` + `cohort_members` (with `batch_no`) to store approved learners per course.
- **Enroll-only gating** – `POST /courses/:courseKey/enroll` now validates cohort membership and supports `?checkOnly=true` so the frontend can verify eligibility before opening the protocol modal.

## 2025-12-24
- **RAG store migrated to Postgres pgvector** – added `course_chunks` table + pgvector index, switched `ragService` retrieval to SQL similarity search, and removed Neo4j dependencies from env validation and runtime.
- **Import pipeline added** – new `scripts/importCourseChunks.ts` ingests JSON exports with precomputed embeddings to avoid re-embedding costs.

## 2025-12-15
- **Resilient study personas** – Added the `topic_personalization` CRUD endpoints in `backend/src/routes/lessons.ts` plus client caching so learners can always switch back to their saved persona even after logging out. Upserts ensure we never duplicate rows for the same `(user_id, course_id)` pair.
- **Prompt suggestions API** – `/lessons/courses/:courseKey/prompts` now validates optional `topicId` and `parentSuggestionId` query parameters, returning curated prompts in display order. This powers the follow-up suggestion tree rendered inside the tutor dock.

## 2025-12-05
- **Enrollment endpoint** – Added `POST /courses/:courseKey/enroll` in `backend/src/routes/courses.ts` (with helper `ensureEnrollment`), reusing slug resolution so CourseDetails can create or reactivate enrollments idempotently.
- **Tutor quota enforcement** – Introduced `module_prompt_usage`, `services/promptUsageService.ts`, and quota checks inside `assistantRouter`. Each typed prompt increments the counter after OpenAI succeeds, while follow-up suggestions bypass the quota because they use curated answers.

## 2025-12-02
- **AI tutor identifier fix** – Frontend and backend now consistently use the public course slug (`ai-in-web-development`) for RAG calls. The tutor route was already slug-aware, but the player sent the Postgres UUID, so the vector store could not find relevant chunks. `handleSendChat` now falls back to the slug before publishing requests.
- **Documentation sweep** – README, `Course_Platform.md`, `CP_Arc.md`, and `rag/rag.md` explicitly describe the ingestion command and the slug requirement so future contributors do not regress the behavior.

## 2025-11-25
- Diagnosed quiz API failures caused by the frontend `apiRequest` helper clobbering `Content-Type: application/json` whenever callers supplied custom headers. Without the header, Express treated quiz POST bodies as empty, Zod reported `courseId`/`moduleNo` as missing, and `quiz_attempts` rows showed the anonymous fallback user id.
- Updated the helper so it now merges headers before sending the `fetch` request, guaranteeing both the bearer `Authorization` header and JSON content type reach the backend. Verified the `/api/quiz/sections`, `/api/quiz/progress`, `/api/quiz/attempts`, and submission endpoints now return full question sets for all topic pairs and persist attempts against the signed-in learner.

## 2025-10-08
- Bootstrapped Prisma ORM (`prisma/schema.prisma`) to match the production Postgres schema and generated the client for the Node runtime.
- Hardened environment validation (`src/config/env.ts`) with Google OAuth + JWT settings and wired Prisma datasource sharing (`src/services/prisma.ts`).
- Implemented Google OAuth flow helpers (`src/services/googleOAuth.ts`) and user provisioning logic (`src/services/userService.ts`).
- Added session management service (`src/services/sessionService.ts`) to issue, rotate, hash, and revoke JWT-backed sessions persisted in `user_sessions`.
- Introduced authentication middleware (`src/middleware/requireAuth.ts`) and async route helper to streamline Express error handling.
- Created new API routes for OAuth, token refresh, logout, profile lookup, and Postgres-backed health checks.

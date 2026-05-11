# Backend Development Log

## 2026-01-09
- Added `topic_content_assets` and contentKey resolution in `lessonsRouter`.
- `topics.text_content` now supports derived block JSON; backend resolves persona assets and returns fully rendered blocks.

## 2026-01-08
- Added `cohort_batch_projects` table and `/cohort-projects/:courseKey` route.
- Membership resolution now returns cohort + batch and surfaces project payloads to the client.

## 2025-12-31
- Tutor chat memory: added `cp_rag_chat_sessions` + `cp_rag_chat_messages` plus `/assistant/session`.
- Follow-up rewrite: assistant now rewrites ambiguous prompts and stores rolling summaries.

## 2025-12-30
- Cold calling backend: added cold call tables and `/cold-call` endpoints.

## 2025-12-29
- Cohort allowlist tables: added `cohorts` + `cohort_members` with `batch_no`.
- Enrollment gating: `/courses/:courseKey/enroll?checkOnly=true` validates membership.

## 2025-12-24
- RAG store migrated to Postgres pgvector (`course_chunks`).
- Import pipeline added (`scripts/importCourseChunks.ts`).

## 2025-12-15
- Study personas: `topic_personalization` CRUD endpoints and client caching.
- Prompt suggestions API: `/lessons/courses/:courseKey/prompts`.

## 2025-12-05
- Enrollment endpoint and `ensureEnrollment` helper.
- Tutor quota enforcement via `module_prompt_usage`.

## 2025-12-02
- AI tutor identifier fix for slug-based RAG queries.
- Documentation sweep for ingestion and slug rules.

## 2025-11-25
- Quiz API header merge fix to restore POST payloads.

## 2025-10-08
- Prisma bootstrap, OAuth flow helpers, session service, and core API routes.

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

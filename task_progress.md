# Task Progress Log

Running log of notable tasks and changes completed on the backend and frontend stack of the Course Platform project.

## 2026-02-12 - Async Job Queue & Real-time AI
- Implemented `background_jobs` table for asynchronous AI processing.
- Replaced polling with `GET /stream/:jobId` SSE endpoint.
- Validated performance: 50 concurrent users with 3ms server latency.
- Fixed RAG course ID mismatch; chatbot now functional.

## 2026-03-03 - On-Demand Player UX + Simulation Theming
- Refined `OnDemandPlayerPage.tsx` into a premium dark-mode layout with glassmorphism panels and micro-interactions.
- Added content-pane scroll reset on lesson changes using a dedicated scroll container ref.
- Added a `theme` prop to `SimulationExercise` so On-Demand can render dark styling while Cohort stays light.

## 2026-03-10 - On-demand completion + certificates
- Added `course_certificates` table to store issued certificates and feedback.
- Added `/api/certificates/:courseKey` (GET) and `/api/certificates/:courseKey/feedback` (POST).
- Wired on-demand congrats routes under `/ondemand/:id/congrats/*`.
- Certificate page now overlays learner name and course title on the certificate image.

## 2026-01-09 - Topic content assets + derived layouts
- Added `topic_content_assets` to store persona-specific content payloads (text, image, video, ppt).
- `topics.text_content` now supports derived block JSON with `contentKey` references.
- `lessonsRouter` resolves content keys by learner persona and returns fully resolved blocks to the frontend.

## 2026-01-08 - Cohort batch projects
- Added `cohort_batch_projects` table and `/cohort-projects/:courseKey` API.
- Course player header now includes a Cohort Project button and modal.

## 2026-01-05 - Course slug and content source update
- Canonical course slug remains `ai-in-web-development` (UI marketing label `ai-native-fullstack-developer` appears in copy).
- RAG source PDFs include `Web Dev using AI Course Content.pdf` (default) and `AI Native Full Stack Developer.pdf` (alternate).

## 2025-12-31 - Learner telemetry and tutor monitor APIs
- Added `learner_activity_events` plus ingestion service. Frontend buffers events in `src/utils/telemetry.ts` and posts to `/api/activity/events`.
- New activity router exposes `/api/activity/courses/:courseId/learners` and `/api/activity/learners/:id/history`.
- Added persistent tutor chat memory (`cp_rag_chat_sessions`, `cp_rag_chat_messages`) and follow-up rewrite.

## 2025-12-30 - Cold calling checkpoint
- Added cold call tables and `/cold-call` endpoints for blind-response prompts, threaded replies, and stars.
- Rendered the cold calling block after study text in the course player.

## 2025-12-29 - Cohort allowlist enrollment gate
- Added `cohorts` + `cohort_members` (with `batch_no`) to store approved learners per course.
- Enrollment checks validate cohort membership before opening the protocol modal.

## 2025-12-24 - RAG migration to Supabase
- Migrated tutor retrieval from Neo4j to Postgres pgvector (`course_chunks`).
- Added JSON import workflow for precomputed embeddings.

## 2025-12-15 - Study personas and prompts
- Persisted saved study personas with `topic_personalization` and client-side history keys.
- Shipped curated prompt trees for the tutor dock with typed prompt quota enforcement.

## 2025-12-05 - Enrollment autopilot and certificate polish
- Automatic enrollment on protocol acceptance.
- Refreshed certificate preview copy and CTA states.

## 2025-11-27 - Landing page redirect and nav cleanup
- CTA routes now point directly to the course player.
- Unpublished courses show a "Coming soon" toast.

## 2025-11-25 - Quiz payload fix
- Updated API helper to merge headers and restore quiz POST bodies.

## 2025-10-15 - Cart endpoints
- Created cart CRUD endpoints and migrations.

## 2025-10-08 - Monorepo reboot
- Split frontend and backend workspaces.
- Implemented OAuth, session heartbeat, and core course player scaffolding.

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

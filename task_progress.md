# Task Progress Log

Running log of notable tasks and changes completed on the backend and frontend stack of the Course Platform project.

## 2026-02-12 - Async Job Queue & Real-time AI
- Implemented `background_jobs` table for asynchronous AI processing.
- Replaced polling with `GET /stream/:jobId` SSE endpoint.
- Validated performance: 50 concurrent users with 3ms server latency.
- Fixed RAG course ID mismatch; chatbot now functional.

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

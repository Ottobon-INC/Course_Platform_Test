# App Changes

Living changelog for the Course Platform. Each section captures what changed, why, and the primary files involved.

## 2026-01-09 - Persona-aware content assets and derived layouts
- Added `topic_content_assets` as the master store for persona-tagged content payloads.
- `topics.text_content` now supports derived block JSON with `contentKey` references.
- `lessonsRouter` resolves content keys by learner persona and returns resolved blocks to the frontend, keeping the client lightweight.

## 2026-01-08 - Cohort batch projects in the course player
- Added `cohort_batch_projects` table to store project briefs per cohort batch.
- Added `/cohort-projects/:courseKey` endpoint and a Cohort Project modal in the course player header.

## 2025-12-31 - Tutor chat memory and follow-up rewrite
- Persistent sessions in `cp_rag_chat_sessions` + `cp_rag_chat_messages`.
- `/assistant/query` now rewrites ambiguous follow-ups and `/assistant/session` hydrates history.

## 2025-12-30 - Cold calling cohort checkpoint
- Blind-response prompts added via `cold_call_prompts`.
- Threaded cohort feed and star reactions shipped in the player.

## 2025-12-29 - Cohort allowlist enrollment gate
- `cohorts` + `cohort_members` with `batch_no` added to track approved learners.
- CourseDetails now validates cohort access before opening the protocol modal.

## 2025-12-24 - RAG moved to Postgres pgvector
- `course_chunks` now stores embeddings in Postgres.
- Added `scripts/importCourseChunks.ts` to load precomputed embeddings.

## 2025-12-15 - Personalized narration improvements
- Study personas persist across sessions via `topic_personalization`.
- Accessible questionnaire dialog and prompt suggestion flow improved.

## 2025-12-05 - Enrollment autopilot, tutor quotas, certificate polish
- Auto enrollment on protocol acceptance.
- Tutor prompt quotas enforced via `module_prompt_usage`.
- Certificate preview copy updated.

## 2025-11-27 - Landing funnel and routing cleanup
- Landing CTAs route directly to the course player.
- Unpublished courses show a "Coming soon" toast.

## 2025-11-25 - Quiz payload fix
- Header merging fix restored quiz POST bodies.

## 2025-10-15 - Cart API and migrations
- Added cart CRUD backed by `cart_items`.

## 2025-10-08 - Monorepo bootstrap
- Split frontend and backend workspaces and wired OAuth/session handling.

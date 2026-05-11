# App Changes

Living changelog for the Course Platform. Each section captures what changed, why, and the primary files involved.

## 2026-03-10 - On-demand congrats + certificate storage
- **On-demand congrats flow** now lives under `/ondemand/:id/congrats/*` instead of `/course/:id/congrats/*`.
- **Certificate storage** added via `course_certificates` table (server-backed name/title/feedback).
- **Certificate APIs** added: `GET /api/certificates/:courseKey` and `POST /api/certificates/:courseKey/feedback`.
- **Frontend** now overlays learner + course text on the certificate image.

## 2026-02-12 - Async AI Architecture & RAG Fixes
- **Async Job Queue**: Replaced blocking AI calls with Postgres-based job queue `background_jobs` + worker process.
- **Real-time SSE**: Implemented Server-Sent Events (`/stream/:jobId`) for instant job result streaming, removing polling latency.
- **RAG Fixes**: Resolved UUID/Slug mismatch in vector search; chatbot now answers correctly.
- **Course Update**: Renamed slug to `ai-native-fullstack-developer` (legacy slug preserved).
- **Performance**: Validated 50-user concurrent load with <5ms server health latency.

## 2026-03-03 - On-Demand Player UX + Simulation Theming
- **On-Demand Player**: Refined `OnDemandPlayerPage.tsx` into a premium dark UI with glassmorphism panels, diffused shadows, and micro-interactions.
- **Scroll Reset**: Added a dedicated scroll container ref so lesson changes snap the main content back to the top.
- **Simulation Isolation**: `SimulationExercise` now supports a `theme` prop so On-Demand can render a dark “lab” while Cohort remains light.

## 2026-02-03 - Intelligent Landing Chatbot & Auth Resolution
- **Responsive Sales Agent**: Implemented `LandingChatBot.tsx` with RAG connection (`landingAssistantRouter`) to explain offerings.
- **Smart Engagement**: Personalized greetings, session-persistent history, and "Smart Redirect" buttons (using `<<ACTION:URL>>`) to drive traffic.
- **Usage Control**: Token throttling (fallback after 10 turns) and strict limits (5 Guest / 10 User).
- **Core Fixes**: Resolved global auth redirect mechanism via `buildApiUrl` to correctly target backend ports from any route.

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

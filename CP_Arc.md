# Course Platform Architecture Overview

This document explains how the React SPA, Express API, Postgres, and the AI tutor stack work together.

## 1. Runtime topology
Primary course slug: `ai-native-fullstack-developer` (Legacy alias: `ai-in-web-development`).

```
Browser -> React SPA (5173) -> Express API (4000) -> Prisma -> Postgres
                                   |-> pgvector (course_chunks)
                                   |-> OpenAI API (RAG)
```

## 2. Content pipeline (master + derived JSON)
1. `topics.text_content` may contain derived JSON with ordered blocks.
2. Blocks can include `contentKey` references (for text/image/video/ppt assets).
3. The master payloads live in `topic_content_assets` keyed by `(topic_id, content_key, persona_key)`.
4. `lessonsRouter` resolves the layout using the learner tutor persona (from `learner_persona_profiles`), falls back to default assets, and returns resolved block data.
5. The frontend renders the resolved blocks sequentially and never sees persona keys.

## 3. Cohort project pipeline
1. `cohort_members.batch_no` assigns each learner to a batch.
2. `cohort_batch_projects` stores a brief per `(cohort_id, batch_no)`.
3. `GET /cohort-projects/:courseKey` returns the brief for the authenticated learner.
4. `CoursePlayerPage` shows a Cohort Project button and modal.

## 4. Persona systems
- Study persona (normal/sports/cooking/adventure) is stored in `topic_personalization` and only affects text variants.
- Tutor persona (non_it_migrant, rote_memorizer, english_hesitant, last_minute_panic, pseudo_coder) is stored in `learner_persona_profiles` and drives asset resolution for content blocks.

## 5. Router matrix (high level)
- `auth` - OAuth + JWT lifecycle
- `courses` - catalog + enrollments
- `lessons` - topics, personalization, progress, content resolution

```
Browser -> React SPA (5173) -> Express API (4000) -> Prisma -> Postgres
                                   |-> pgvector (course_chunks)
                                   |-> OpenAI API (RAG)
```

## 2. Content pipeline (master + derived JSON)
1. `topics.text_content` may contain derived JSON with ordered blocks.
2. Blocks can include `contentKey` references (for text/image/video/ppt assets).
3. The master payloads live in `topic_content_assets` keyed by `(topic_id, content_key, persona_key)`.
4. `lessonsRouter` resolves the layout using the learner tutor persona (from `learner_persona_profiles`), falls back to default assets, and returns resolved block data.
5. The frontend renders the resolved blocks sequentially and never sees persona keys.

## 3. Cohort project pipeline
1. `cohort_members.batch_no` assigns each learner to a batch.
2. `cohort_batch_projects` stores a brief per `(cohort_id, batch_no)`.
3. `GET /cohort-projects/:courseKey` returns the brief for the authenticated learner.
4. `CoursePlayerPage` shows a Cohort Project button and modal.

## 4. Persona systems
- Study persona (normal/sports/cooking/adventure) is stored in `topic_personalization` and only affects text variants.
- Tutor persona (non_it_migrant, rote_memorizer, english_hesitant, last_minute_panic, pseudo_coder) is stored in `learner_persona_profiles` and drives asset resolution for content blocks.

## 5. Router matrix (high level)
- `auth` - OAuth + JWT lifecycle
- `courses` - catalog + enrollments
- `lessons` - topics, personalization, progress, content resolution
- `cohortProjects` - cohort project lookup
- `quiz` - sections, attempts, submissions
- `assistant` - tutor chat (RAG + memory)
- `coldCall` - cohort prompts
- `activity` - telemetry ingestion + tutor monitoring
- `tutors` - tutor dashboard endpoints
- `personaProfiles` - learner tutor persona analysis
- `stream` - **SSE** job result streaming (`/stream/:jobId`)

## 6. Async Engine (Job Queue)
- `POST /assistant/query` pushes `BackgroundJob` to Postgres `background_jobs` table.
- Worker process (`aiWorker.ts`) polls DB, executes RAG/LLM, updates job status.
- `GET /stream/:jobId` polls DB (500ms) and pushes SSE event on completion.

## 7. Data highlights
- `topic_content_assets` + derived layout JSON for content orchestration.
- `cohort_batch_projects` for per-batch project briefs.
- `course_chunks` with pgvector for tutor retrieval.

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

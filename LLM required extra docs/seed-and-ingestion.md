# Seed + Ingestion Notes (Identifiers + One-offs)

## 1) Seed script
File: `backend/prisma/seed.ts`

### Hard-coded IDs
- Primary course UUID: `f26180b2-5dda-495a-a014-ae02e63f172f`
- Primary slug: `ai-in-web-development`

### Seeded records
1) **Admin user**
   - Email: `jaswanthvanapalli12@gmail.com`
   - Password: `Ottobon@2025` (hashed with scrypt)
   - Role: `admin`

2) **Courses**
   - Several courses are seeded; the primary is `AI in Web Development` with slug `ai-in-web-development`.
   - Additional courses (React, Python, etc.) are added for catalog views.

3) **Topics**
   - CSV file: `topics_all_modules.csv` (repo root).
   - Only rows with `course_id === COURSE_ID` are inserted.
   - Existing topics for the course are deleted before seeding.

4) **Simulation exercises**
   - One per topic; generated from topic names.

5) **Page content**
   - `page_content` records for `about`, `courses`, `become-a-tutor`.

## 2) RAG ingestion
### Default ingestion
Command:
```bash
cd backend
npm run rag:ingest "../Web Dev using AI Course Content.pdf" ai-in-web-development "AI Native Full Stack Developer"
```
- Chunk size: 900 chars
- Overlap: 150 chars
- Embedding model: `text-embedding-3-small` (default)
- Writes to `course_chunks` (pgvector)

### Import precomputed embeddings
Command:
```bash
cd backend
npm run rag:import <json-file>
```
- Default JSON path: `../neo4j_query_table_data_2025-12-24.json`
- Validates each row has `chunkId`, `courseId`, `content`, `embedding`.

## 3) Cohort allowlist
- Manual seeding required for `cohorts` + `cohort_members`.
- `cohort_members` must include either `userId` or `email` (email is normalized and later linked to userId).

## 4) Cold call prompts
- Seed `cold_call_prompts` per topic to enable cold calling UI.

## 5) Content assets
- For JSON block layouts with `contentKey`, seed `topic_content_assets` for each key.

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

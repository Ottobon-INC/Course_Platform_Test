# System Design Issues – Course Platform Backend

## Code Quality Issues

1. **Duplicated Functions** – Same `resolveCourseId()` logic copy-pasted across 4+ route files instead of a shared utility.

2. **Business Logic in Route Handlers** – Routes contain 300-800+ lines mixing HTTP handling with database queries and business rules.

3. **Hardcoded Constants Scattered Everywhere** – Magic numbers and config values buried in route files instead of centralized config.

---

## Performance & Scalability Issues

4. **N+1 Query Patterns** – Fetching collections then making additional queries in loops, causing 10,000+ queries under load.

5. **In-Memory Rate Limiting** – Rate limiter stores state in Node.js memory, not distributed across server instances.

6. **Synchronous OpenAI API Calls** – AI calls block the request for 2-5 seconds with no queue or background processing.

7. **No Query Caching** – Expensive queries (course lookups, module states, embeddings) re-run on every request.

8. **Unbounded Query Results** – List endpoints return all records without pagination, causing huge payloads for power users.

9. **No Connection Pooling Strategy** – Prisma uses default pool size (~10 connections), causing starvation under load.

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

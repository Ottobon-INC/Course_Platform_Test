# Legacy / Unwired Inventory

This file lists components, routes, and configs that exist in the repo but are **not wired** in runtime based on `frontend/src/App.tsx` and `backend/src/app.ts`.

## 1) Frontend pages NOT routed
These files exist under `frontend/src/pages` but are not referenced in `App.tsx`:
- `AuthPage.tsx`
- `TutorLoginPage.tsx`
- `CoursesPage.tsx`
- `DashboardPage.tsx`
- `CartPage.tsx`
- `AboutPage.tsx`

Legacy-but-routed pages:
- `EnrollmentPage.tsx` and `AssessmentPage.tsx` are routed but considered legacy flow.

## 2) Backend routes NOT mounted
All active route files in `backend/src/routes` are mounted in `backend/src/app.ts`.

Unused/legacy route files:
- `backend/src/routes/lessons.ts.bak` (not imported)

## 3) Env variables that can drift
- `VITE_API_URL` (used only in Navbar OAuth redirect)
- `VITE_API_BASE_URL` (used by API helper)

These should be kept aligned to avoid inconsistent routing.

## 4) Data paths not enforced by Prisma
Tables used by quizzes (`quiz_*`, `module_progress`) are not in Prisma schema; they must exist manually.

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

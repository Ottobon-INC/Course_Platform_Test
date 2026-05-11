# Quiz Data Requirements (Max Pair + Missing Data Behavior)

This doc explains how quiz data is interpreted by the engine, and what minimum data is required for correct unlock behavior.

## 1) How `maxPair` is computed
- `maxPair` is derived **only** from `quiz_questions`:
  ```sql
  SELECT MAX(topic_pair_index) FROM quiz_questions WHERE course_id = ? AND module_no = ?
  ```
- This value determines whether a passed quiz should mark the **module** as passed.

## 2) Minimum required quiz data per module
For every module you want to gate:
- At least **1 quiz question** per `topic_pair_index` that exists in that module.
- The **highest** `topic_pair_index` must exist, or the module can never pass.

Recommended minimum:
- For each module with N lessons → topic pairs = `ceil(N / 2)`.
- For each pair, seed at least 1 question + options.

## 3) Behavior when data is missing
- If `quiz_questions` has **no rows** for a module:
  - `/quiz/sections/:courseKey` returns **no sections** for that module.
  - The frontend will not show a quiz for that module, but lessons can still appear.
  - **Module unlock gating becomes inconsistent** because module state depends on quiz sections.

- If the **last topic pair** is missing:
  - `maxPair` is lower than expected.
  - Module pass can only occur at that lower pair.
  - If a user passes a later quiz (that isn’t maxPair), the module will **not** be marked passed.

- If a quiz attempt has **no questions**:
  - `/quiz/attempts/:id/submit` returns `400` "Attempt has no questions to grade".

## 4) Module count derivation (used in tutor dashboard)
- Tutor progress totals are based on `topics` table:
  - Distinct `module_no` where `module_no > 0`.
- If topics are missing or module_no values are incorrect, progress totals will be wrong even if quiz data is correct.

## 5) Summary: required consistency
To avoid unlock bugs, keep these aligned:
- `topics` (module_no + topic_number)
- `quiz_questions` (module_no + topic_pair_index)
- `quiz_options` (for each question)

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

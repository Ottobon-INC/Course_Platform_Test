# Cold Calling Spec (State Machine + Rules)

Source of truth: `backend/src/routes/coldCall.ts` + `frontend/src/components/ColdCalling.tsx`.

## 1) State machine
```
unauthenticated -> show “Sign in to participate”
  |
  v
access_denied (not in cohort) -> show cohort error message
  |
  v
prompt_loaded (hasSubmitted=false) -> input box only
  |
  v
submitted (hasSubmitted=true) -> full cohort feed + reply/star
```

## 2) Membership gating
- Cohort membership is required for **all** cold call actions.
- Membership is resolved from the **active cohorts** for a course (`cohorts.is_active = true`).
- User can match by `userId` or email (case-insensitive).
- If userId is missing on the member record, the system updates it after the first match.
- If no active cohort: 409.
- If no member match: 403 with `COHORT_ACCESS_DENIED_MESSAGE`.

## 3) Endpoints and rules
### GET `/cold-call/prompts/:topicId`
- Returns `hasSubmitted=false` if user has **no** top-level message in that cohort.
- If top-level exists, returns full message feed ordered by `createdAt`.

### POST `/cold-call/messages`
- Creates **top-level** response.
- One per user per prompt; if already exists -> 409.
- After creation, `rootId` is set to the message ID.

### POST `/cold-call/replies`
- Parent must exist and be `status = active`.
- Cannot reply to your own message (403).
- Must be in same cohort as parent (403).
- Must have submitted a top-level response first (403).
- `rootId` inherits from parent (or parentId if missing).

### POST `/cold-call/stars`
- Cannot star your own response (403).
- Must be in same cohort as message (403).
- Must have submitted a top-level response first (403).
- Upserted per `(messageId, userId)`.

### DELETE `/cold-call/stars/:messageId`
- Removes star for the current user in that cohort.

## 4) Thread model
- `parent_id` -> direct reply parent.
- `root_id` -> top-level message for thread grouping.
- Thread order is chronological (ascending createdAt).

## 5) UI behavior
- **Blind response**: cohort feed is hidden until the learner submits.
- **Self-protection**:
  - No reply button on self messages.
  - Star action disabled for self messages.
- Responses are sorted so the current user appears first at the top-level.

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

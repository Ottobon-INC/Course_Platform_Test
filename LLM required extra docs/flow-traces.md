# Flow Traces (Pages → Endpoints → Tables → Gates)

These are step-by-step traces to replicate the app’s behavior.

---

## 1) Login (OAuth) → Refresh → Logout
**Login**
1. Frontend: click Login in Navbar (`/auth/google`).
2. Backend `/auth/google`: sets OAuth state cookie and redirects to Google.
3. Google → `/auth/google/callback`: exchanges code → upserts user → creates `user_sessions` row.
4. Redirects to frontend `/auth/callback` with access + refresh tokens.
5. Frontend stores tokens in localStorage and starts session heartbeat.

**Refresh**
1. Frontend `session.ts` checks access token expiry and refresh buffer.
2. POST `/auth/refresh` with refresh token.
3. Backend verifies refresh token, rotates `user_sessions.jwt_id`, updates stored refresh hash.
4. Frontend stores new tokens and continues heartbeat.

**Logout**
1. Frontend clears localStorage and heartbeat.
2. Optional: POST `/auth/logout` with refresh token → deletes `user_sessions` row.

Tables touched: `users`, `user_sessions`.

---

## 2) Course details → checkOnly enroll → enroll
1. Frontend: `CourseDetailsPage` loads `/courses/:courseKey` and `/lessons/courses/:courseKey/topics`.
2. On Enroll click: `POST /courses/:courseKey/enroll?checkOnly=true`.
3. Backend checks cohort access:
   - `cohorts` (active) + `cohort_members` (email/userId match).
4. If eligible: returns 204, frontend shows protocol modal.
5. On confirm: `POST /courses/:courseKey/enroll` (no `checkOnly`).
6. Backend upserts `enrollments` row.

Tables touched: `courses`, `topics`, `cohorts`, `cohort_members`, `enrollments`.

---

## 3) Study persona (survey) + tutor persona analysis
**Study persona**
1. If no personalization, frontend routes to `/course/:id/path`.
2. POST `/lessons/courses/:courseKey/personalization` with `{ persona }`.
3. Backend upserts `topic_personalization`.

**Tutor persona (analysis)**
1. Frontend posts survey answers to `/persona-profiles/:courseKey/analyze`.
2. Backend classifies via OpenAI → upserts `learner_persona_profiles`.

Tables touched: `topic_personalization`, `learner_persona_profiles`.

---

## 4) Lesson playback → progress writeback
1. `/lessons/courses/:courseKey/topics` returns topics and resolved content.
2. Content resolution:
   - If `topics.text_content` has `contentKey`, backend loads `topic_content_assets` by persona.
3. Frontend renders blocks and media.
4. Progress updates: `PUT /lessons/:lessonId/progress` with `{ progress, status }`.

Tables touched: `topics`, `topic_content_assets`, `topic_progress`, `learner_persona_profiles`.

---

## 5) Cold calling state machine
1. Frontend loads `GET /cold-call/prompts/:topicId`.
2. Backend checks cohort membership.
3. If no submission yet → returns `hasSubmitted=false` (no messages).
4. POST `/cold-call/messages` → creates top-level response, sets `rootId`.
5. Next load returns full thread; user can reply or star.

Tables touched: `cold_call_prompts`, `cold_call_messages`, `cold_call_stars`, `cohorts`, `cohort_members`.

---

## 6) Quiz attempt → submit → module unlock/cooldown
1. Frontend starts quiz: POST `/quiz/attempts` with `courseId, moduleNo, topicPairIndex`.
2. Backend selects random questions from `quiz_questions`, attaches options.
3. User submits: POST `/quiz/attempts/:id/submit` with answers.
4. Backend grades and updates `quiz_attempts`.
5. If passed AND `topic_pair_index == maxPair`, update `module_progress.quiz_passed`.
6. Unlock states returned via `/quiz/sections/:courseKey`.

Tables touched: `quiz_questions`, `quiz_options`, `quiz_attempts`, `module_progress`.

---

## 7) Tutor chat (assistant/query) + session memory
1. Frontend loads suggestions: `GET /lessons/courses/:courseKey/prompts`.
2. `/assistant/session` hydrates chat history.
3. User sends typed prompt → `/assistant/query`.
4. Backend loads chat session, summary, recent turns.
5. Embeds question → fetches `course_chunks` topK.
6. Builds prompt and calls OpenAI → stores messages in `cp_rag_chat_messages`.

Tables touched: `topic_prompt_suggestions`, `cp_rag_chat_sessions`, `cp_rag_chat_messages`, `course_chunks`, `module_prompt_usage`.

---

## 8) Tutor dashboard flows
1. `/tutors` page loads `/tutors/me/courses`.
2. Select course → `/tutors/:courseId/enrollments` and `/tutors/:courseId/progress`.
3. Telemetry monitor → `/activity/courses/:courseId/learners`.
4. Learner timeline → `/activity/learners/:learnerId/history`.
5. Tutor copilot → `/tutors/assistant/query`.

Tables touched: `course_tutors`, `enrollments`, `module_progress`, `learner_activity_events`.

---

## 9) Certificate preview
1. Frontend links to `/course/:id/congrats/certificate` after completion.
2. There is **no backend check**; it is UI-only.

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

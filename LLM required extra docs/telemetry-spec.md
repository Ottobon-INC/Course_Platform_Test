# Telemetry Spec (Events + Tutor Monitor)

Source of truth: `frontend/src/utils/telemetry.ts`, `CoursePlayerPage.tsx`, `ColdCalling.tsx`, and `backend/src/services/activityEventService.ts`.

## 1) Transport
- Client buffers telemetry events and flushes every 4s or when buffer reaches 20 events.
- Endpoint: `POST /activity/events` with `{ events: [...] }`.
- Auth required (`Bearer <token>`).
- Backend max per request: **50** events.

## 2) Event schema
```json
{
  "courseId": "uuid",
  "moduleNo": 1,
  "topicId": "uuid",
  "eventType": "lesson.view",
  "payload": { "...": "..." },
  "occurredAt": "ISO" // optional
}
```

## 3) Known event types (frontend)
**Persona events**
- `persona.survey_complete` `{ persona }`
- `persona.survey_restart`
- `persona.modal_open`
- `persona.preference_saved` `{ persona }`

**Lesson navigation**
- `lesson.view` `{ slug, moduleNo, topicNumber }`
- `lesson.navigate` `{ moduleNo, topicPairIndex, slug }`
- `lesson.quiz_select` `{ moduleNo, topicPairIndex }`
- `lesson.locked_click` `{ moduleNo, reason: "cooldown|quiz|sequence", topicPairIndex }`

**Progress + idle**
- `progress.snapshot` `{ percent }`
- `idle.start` `{ reason: "no_interaction" | "tab_hidden" }`
- `idle.end` `{ reason?: "tab_visible" }`

**Quiz**
- `quiz.start` `{ topicPairIndex }`
- `quiz.submit` `{ answered, totalQuestions }`
- `quiz.pass` `{ scorePercent, correctCount, totalQuestions }`
- `quiz.fail` `{ scorePercent, correctCount, totalQuestions }`

**Tutor**
- `tutor.prompt_typed` `{ questionLength }`
- `tutor.prompt_suggestion` `{ questionLength, suggestionId }`
- `tutor.response_received` `{ suggestionId, followUps }`

**Cold calling**
- `cold_call.loaded` `{ promptId, hasSubmitted }`
- `cold_call.submit` `{ promptId, length }`
- `cold_call.reply` `{ messageId, length }`
- `cold_call.star` `{ messageId, action: "add" | "remove" }`

## 4) Status derivation (backend)
The backend maps events to **derivedStatus** using prefix rules:

**Engaged** (first match wins):
- `video.play`, `video.resume`, `video.buffer.end`, `progress.snapshot`, `persona.*`, `notes.*`, `lesson.*`, `cold_call.*`, `tutor.response`

**Content friction**:
- `quiz.fail`, `quiz.retry`, `tutor.prompt`, `cold_call.star`, `cold_call.submit`, `tutor.response_received`, `content.friction`

**Attention drift**:
- `idle.*`, `video.pause`, `video.buffer.start`, `lesson.locked_click`

If no prefix matches, `derivedStatus` remains null.

## 5) Tutor monitor semantics
- `/activity/courses/:courseId/learners` returns the most recent status per learner by scanning the latest 20 events per user.
- Status priority: content_friction > attention_drift > engaged > fallback.
- `/activity/learners/:learnerId/history` returns reverse-chronological event history (limit default 50, max 100).

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

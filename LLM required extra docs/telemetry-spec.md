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


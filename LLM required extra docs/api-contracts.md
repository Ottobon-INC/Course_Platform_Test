# API Contracts Reference (Course_Platform_Test)

Base URL: the API is mounted at `/` and mirrored under `/api`. All paths below are shown without the `/api` prefix.  
Auth: endpoints marked **Auth** require `Authorization: Bearer <accessToken>`.

Error format (common):
- `{ "message": "..." }`
- Some endpoints also return `{ "issues": ... }` (zod validation) or `{ "errors": ... }` (tutor applications).

---

## Health
### GET `/health`
- Auth: No
- Response 200: `{ "status": "ok", "database": "connected" }`
- Response 503: `{ "status": "degraded", "database": "unavailable", "reason": "..." }`

---

## Auth + Sessions
### POST `/auth/login`
- Auth: No (used for tutor/admin login)
- Body:
  ```json
  { "email": "tutor@example.com", "password": "..." }
  ```
- Response 200:
  ```json
  {
    "user": { "id": "uuid", "email": "...", "fullName": "...", "role": "tutor|admin" },
    "session": {
      "accessToken": "...",
      "accessTokenExpiresAt": "ISO",
      "refreshToken": "...",
      "refreshTokenExpiresAt": "ISO",
      "sessionId": "uuid"
    }
  }
  ```
- Errors: 400 (missing fields), 401 (invalid credentials), 403 (not tutor/admin)

### GET `/auth/google`
- Auth: No
- Query: `?redirect=/path`
- Behavior: sets signed OAuth state cookie and redirects to Google OAuth.

### GET `/auth/google/callback`
- Auth: No
- Query: `?code=...&state=...` (or `?error=...`)
- Behavior: exchanges tokens, creates session, redirects to `/auth/callback` on frontend with query params:
  `accessToken`, `accessTokenExpiresAt`, `refreshToken`, `refreshTokenExpiresAt`, `sessionId`, `userId`, `userEmail`, `userFullName`, `userPicture`, `userEmailVerified`, `redirectPath`.

### POST `/auth/google/exchange`
- Auth: No
- Body or Query: `{ "code": "..." }` (or `?code=...`)
- Response 200: same session payload as `/auth/login`, plus user info.
- Errors: 400 (missing code)

### POST `/auth/google/id-token`
- Auth: No
- Body: `{ "credential": "..." }` OR `{ "idToken": "..." }`
- Response 200: same session payload as `/auth/login`, plus user info.
- Errors: 400 (missing credential)

### POST `/auth/refresh`
- Auth: No
- Body: `{ "refreshToken": "..." }`
- Response 200:
  ```json
  { "session": { "accessToken": "...", "accessTokenExpiresAt": "ISO", "refreshToken": "...", "refreshTokenExpiresAt": "ISO", "sessionId": "uuid" } }
  ```
- Errors: 400 (missing), 401 (invalid/expired/mismatch)

### POST `/auth/logout`
- Auth: No
- Body: `{ "refreshToken": "..." }`
- Response 204
- Errors: 400 (missing or revoke failure)

---

## Users
### GET `/users/me`
- Auth: Yes
- Response 200:
  ```json
  { "user": { "id": "uuid", "email": "...", "fullName": "...", "createdAt": "ISO" } }
  ```
- Errors: 401, 404

---

## Courses + Enrollment
### GET `/courses`
- Auth: No
- Response 200:
  ```json
  { "courses": [ { "id": "uuid", "slug": "...", "title": "...", "description": "...", "price": 3999, "priceCents": 399900, "createdAt": "ISO" } ] }
  ```

### GET `/courses/:courseKey`
- Auth: No
- `courseKey`: UUID or courseName (legacy slug resolves to UUID only).
- Response 200: `{ "course": { ...same shape as list } }`
- Errors: 400, 404

### POST `/courses/:courseKey/enroll`
- Auth: Yes
- Query: `?checkOnly=true` OR Body: `{ "checkOnly": true }`
- Behavior: cohort allowlist check, then upsert enrollment.
- Response 204: when `checkOnly=true` and eligible.
- Response 200: `{ "status": "enrolled", "courseId": "uuid" }`
- Errors: 400/401/403/404

---

## Lessons + Personalization
### GET `/lessons/modules/:moduleNo/topics`
- Auth: No
- Response 200: `{ "topics": [ { topicId, courseId, moduleNo, moduleName, topicNumber, topicName, pptUrl, videoUrl, textContent, textContentSports, textContentCooking, textContentAdventure, isPreview, contentType, simulation } ] }`

### GET `/lessons/courses/:courseKey/topics`
- Auth: Optional (uses token if present to resolve tutor persona)
- Response 200: same `topics` shape as above, with `textContent` possibly resolved from content assets.
- Errors: 400, 404

### GET `/lessons/courses/:courseKey/personalization`
- Auth: Yes
- Response 200: `{ "persona": "normal|sports|cooking|adventure", "hasPreference": true|false }`

### POST `/lessons/courses/:courseKey/personalization`
- Auth: Yes
- Body: `{ "persona": "normal|sports|cooking|adventure" }`
- Response 204
- Errors: 401, 404, 400 (invalid payload)

### GET `/lessons/courses/:courseKey/prompts`
- Auth: Yes
- Query: `topicId` (uuid), `parentSuggestionId` (uuid)
- Response 200: `{ "suggestions": [ { "id": "uuid", "promptText": "...", "answer": "..." | null } ] }`
- Errors: 400, 401, 404

### GET `/lessons/courses/:courseKey/progress`
- Auth: Yes
- Response 200:
  ```json
  {
    "completedCount": 4,
    "totalCount": 12,
    "percent": 33,
    "lessons": [
      { "lessonId": "uuid", "status": "not_started|in_progress|completed", "progress": 60, "updatedAt": "ISO"|null, "completedAt": "ISO"|null, "moduleNo": 1, "topicNumber": 2, "title": "..." }
    ]
  }
  ```

### GET `/lessons/:lessonId/progress`
- Auth: Yes
- Response 200: `{ "progress": { lessonId, progress, status, updatedAt, userId, completedAt } }`
- Errors: 401, 404

### PUT `/lessons/:lessonId/progress`
- Auth: Yes
- Body: `{ "progress": 0-100, "status": "not_started|in_progress|completed" }`
- Response 200: `{ "progress": { ... } }`
- Errors: 400 (zod), 401, 404

---

## Cohort Projects
### GET `/cohort-projects/:courseKey`
- Auth: Yes
- Response 200:
  ```json
  { "cohortId": "uuid", "cohortName": "...", "batchNo": 1, "project": { ...payload }, "updatedAt": "ISO" }
  ```
- Errors: 400/401/403/404/409

---

## AI Tutor (Learner)
### POST `/assistant/query`
- Auth: Yes
- Body:
  ```json
  {
    "question": "...",
    "courseId": "uuid|slug|name",
    "courseTitle": "optional",
    "topicId": "uuid",
    "moduleNo": 1,
    "suggestionId": "uuid" 
  }
  ```
  - `moduleNo` is required for typed prompts (when `suggestionId` is not provided).
- Response 200: `{ "answer": "...", "nextSuggestions": [ { id, promptText, answer } ], "sessionId": "uuid" }`
- Errors: 400 (missing fields), 404 (course/topic/suggestion), 429 (rate limit or module quota), 500 (LLM failure)

### GET `/assistant/session`
- Auth: Yes
- Query: `courseId`, `topicId`
- Response 200:
  ```json
  { "sessionId": "uuid"|null, "messages": [ { "messageId": "uuid", "role": "user|assistant", "content": "...", "createdAt": "ISO" } ] }
  ```
- Errors: 400/404

---

## Persona Profiles (Tutor Persona)
### GET `/persona-profiles/:courseKey/status`
- Auth: Yes
- Response 200: `{ "hasProfile": true|false, "updatedAt": "ISO"|null }`

### POST `/persona-profiles/:courseKey/analyze`
- Auth: Yes
- Body:
  ```json
  { "responses": [ { "questionId": "q1", "prompt": "...", "answer": "..." } ] }
  ```
- Response 200: `{ "status": "saved" }`
- Errors: 400/401/404

---

## Quiz
### GET `/quiz/questions`
- Auth: No
- Query: `courseId`, `moduleNo`, `topicPairIndex`, `limit` (<= 20)
- Response 200:
  ```json
  { "questions": [ { questionId, prompt, moduleNo, topicPairIndex, options:[{ optionId, text }] } ], "count": 5 }
  ```

### GET `/quiz/sections/:courseKey`
- Auth: Yes
- Response 200:
  ```json
  {
    "sections": [
      {
        "moduleNo": 1,
        "topicPairIndex": 1,
        "title": "Module 1 • Topic pair 1",
        "subtitle": null,
        "questionCount": 5,
        "unlocked": true,
        "passed": false,
        "status": "passed|failed|null",
        "lastScore": 3,
        "attemptedAt": "ISO"|null,
        "moduleLockedDueToCooldown": false,
        "moduleLockedDueToQuiz": false,
        "moduleCooldownUnlockAt": "ISO"|null,
        "moduleUnlockedAt": "ISO"|null,
        "moduleWindowEndsAt": "ISO"|null
      }
    ]
  }
  ```

### POST `/quiz/attempts`
- Auth: Yes
- Body: `{ "courseId": "uuid|slug|name", "moduleNo": 1, "topicPairIndex": 1, "limit": 5 }`
- Response 201: `{ "attemptId": "uuid", "courseId": "uuid", "moduleNo": 1, "topicPairIndex": 1, "questions": [ ... ] }`
- Errors: 400/401/404

### POST `/quiz/attempts/:attemptId/submit`
- Auth: Yes
- Body: `{ "answers": [ { "questionId": "uuid", "optionId": "uuid" } ] }`
- Response 200:
  ```json
  {
    "attemptId": "uuid",
    "result": {
      "correctCount": 3,
      "totalQuestions": 5,
      "scorePercent": 60,
      "passed": false,
      "thresholdPercent": 70,
      "answers": [ { "questionId": "uuid", "chosenOptionId": "uuid", "correctOptionId": "uuid", "isCorrect": false } ]
    },
    "progress": [ { "moduleNo": 1, "quizPassed": false, "unlocked": true, "completedAt": null, "updatedAt": "ISO", "cooldownUntil": "ISO", "unlockAvailableAt": null, "lockedDueToCooldown": false, "lockedDueToQuiz": false, "passedAt": null } ]
  }
  ```
- Errors: 400/403/404

### GET `/quiz/progress/:courseKey`
- Auth: Yes
- Response 200: `{ "courseId": "uuid", "modules": [ ...same as progress above... ] }`

---

## Cold Calling
### GET `/cold-call/prompts/:topicId`
- Auth: Yes
- Response 200 (not submitted): `{ "prompt": {...}, "cohort": {...}, "hasSubmitted": false }`
- Response 200 (submitted): `{ "prompt": {...}, "cohort": {...}, "hasSubmitted": true, "messages": [ { messageId, body, parentId, rootId, createdAt, user:{userId,fullName}, starCount, starredByMe } ] }`
- Errors: 400/401/403/404/409

### POST `/cold-call/messages`
- Auth: Yes
- Body: `{ "promptId": "uuid", "body": "..." }`
- Response 201: `{ "messageId": "uuid" }`
- Errors: 400/401/403/404/409

### POST `/cold-call/replies`
- Auth: Yes
- Body: `{ "parentId": "uuid", "body": "..." }`
- Response 201: `{ "messageId": "uuid" }`
- Errors: 400/401/403/404

### POST `/cold-call/stars`
- Auth: Yes
- Body: `{ "messageId": "uuid" }`
- Response 200: `{ "status": "starred" }`
- Errors: 400/401/403/404

### DELETE `/cold-call/stars/:messageId`
- Auth: Yes
- Response 204
- Errors: 400/401/403/404

---

## Telemetry + Tutor Monitor
### POST `/activity/events`
- Auth: Yes
- Body:
  ```json
  { "events": [ { "courseId": "uuid", "moduleNo": 1, "topicId": "uuid", "eventType": "lesson.view", "payload": { ... }, "occurredAt": "ISO" } ] }
  ```
- Response 204
- Errors: 400/401

### GET `/activity/courses/:courseId/learners`
- Auth: Yes (tutor/admin assigned)
- Response 200: `{ "learners": [ { eventId, userId, courseId, moduleNo, topicId, eventType, derivedStatus, statusReason, createdAt } ], "summary": { engaged, attention_drift, content_friction, unknown } }`
- Errors: 400/401; access denial in `ensureTutorOrAdminAccess` currently bubbles to 500 due to the global error handler.

### GET `/activity/learners/:learnerId/history`
- Auth: Yes (self or tutor/admin)
- Query: `courseId`, `limit`, `before`
- Response 200: `{ "events": [ { eventId, userId, courseId, moduleNo, topicId, eventType, derivedStatus, statusReason, createdAt } ] }`
- Errors: 400/401; access denial in `ensureTutorOrAdminAccess` currently bubbles to 500.

---

## Tutor Dashboard
### POST `/tutors/login`
- Auth: No
- Body: `{ "email": "...", "password": "..." }`
- Response 200: same session shape as `/auth/login` plus `tutorId`, `displayName`.
- Errors: 400/401/403

### POST `/tutors/assistant/query`
- Auth: Yes (role=tutor)
- Body: `{ "courseId": "uuid", "question": "..." }`
- Response 200: `{ "answer": "..." }`
- Errors: 400/401/403/500

### GET `/tutors/me/courses`
- Auth: Yes (role=tutor)
- Response 200: `{ "courses": [ { courseId, slug, title, description, role } ] }`

### GET `/tutors/:courseId/enrollments`
- Auth: Yes (role=tutor, assigned to course)
- Response 200: `{ "enrollments": [ { enrollmentId, enrolledAt, status, userId, fullName, email } ] }`

### GET `/tutors/:courseId/progress`
- Auth: Yes (role=tutor, assigned to course)
- Response 200: `{ "learners": [ { userId, fullName, email, enrolledAt, completedModules, totalModules, percent } ], "totalModules": number }`

---

## Admin
### GET `/admin/tutor-applications`
- Auth: Yes (role=admin)
- Response 200: `{ "applications": [ ...raw table rows... ] }`

### POST `/admin/tutor-applications/:applicationId/approve`
- Auth: Yes (role=admin)
- Response 200:
  ```json
  {
    "tutor": { "tutorId": "uuid", "userId": "uuid", "fullName": "...", "email": "..." },
    "course": { "courseId": "uuid", "slug": "...", "title": "..." },
    "message": "Application approved and course created"
  }
  ```
- Errors: 404 (application not found)

---

## Tutor Applications (Public)
### POST `/tutor-applications`
- Auth: No
- Body: `{ fullName, email, phone?, headline, courseTitle, courseDescription, targetAudience, expertiseArea, experienceYears?, availability }`
- Response 201: `{ "application": { "id": "uuid", "status": "pending", "submittedAt": "ISO" } }`
- Errors: 400 (validation)

---

## Cart
### GET `/cart`
- Auth: Yes
- Response 200: `{ "items": [ { courseId, title, price, addedAt, description?, instructor?, duration?, rating?, students?, level?, thumbnail? } ] }`

### POST `/cart`
- Auth: Yes
- Body: `{ "course": { id, title, price, description?, instructor?, duration?, rating?, students?, level?, thumbnail? } }`
- Response 200: `{ "items": [ ... ] }`

### DELETE `/cart/items/:courseSlug`
- Auth: Yes
- Response 200: `{ "items": [ ... ] }`

### DELETE `/cart`
- Auth: Yes
- Response 204

---

## CMS Pages
### GET `/pages/:slug`
- Auth: No
- Response 200:
  ```json
  { "page": { "slug": "...", "title": "...", "subtitle": "...", "heroImage": "...", "sections": { ... }, "updatedAt": "ISO" } }
  ```
- Errors: 400/404

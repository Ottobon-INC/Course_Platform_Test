# Middleware Map (Route → Middleware Chain → Errors)

This table lists the runtime middleware chain as defined in `backend/src/app.ts` and route files.

**Auth context (`requireAuth`)**
When present, `req.auth` is populated with:
```ts
{ userId: string; sessionId: string; jwtId: string; role?: string }
```

**Common error mapping**
- `requireAuth`: 401 with `{ message: "Authorization header is missing" | "Access token is missing" | "Access token expired" | "Invalid access token" }`.
- `requireTutor`: 403 with `{ message: "Tutor access required" }`.
- `requireAdmin`: 403 with `{ message: "Admin access required" }`.
- Zod validation failures: 400 with `{ message: "Invalid ...", issues: ... }`.
- Some service errors are thrown (e.g., `ensureTutorOrAdminAccess`) and bubble to the global error handler → 500 `{ message: "Internal server error" }`.

---

## Auth
| Endpoint | Middleware chain | Notes |
|---|---|---|
| `POST /auth/login` | `asyncHandler` | Tutor/admin login; 400/401/403 errors.
| `GET /auth/google` | no auth | Sets OAuth state cookie + redirect.
| `GET /auth/google/callback` | `asyncHandler` | Exchanges code → redirects to frontend.
| `POST /auth/google/exchange` | `asyncHandler` | Code exchange in JSON.
| `POST /auth/google/id-token` | `asyncHandler` | ID token verify in JSON.
| `POST /auth/refresh` | `asyncHandler` | Refresh token rotation.
| `POST /auth/logout` | `asyncHandler` | Session revoke by refresh token.

## Users
| Endpoint | Middleware chain | Notes |
|---|---|---|
| `GET /users/me` | `requireAuth` → `asyncHandler` | 401 if no token; 404 if user missing.

## Courses
| Endpoint | Middleware chain | Notes |
|---|---|---|
| `GET /courses` | `asyncHandler` | Public catalog.
| `GET /courses/:courseKey` | `asyncHandler` | Resolves UUID or courseName.
| `POST /courses/:courseKey/enroll` | `requireAuth` → `asyncHandler` → `checkCohortAccessForUser` | `checkOnly` returns 204; 403 if not in cohort.

## Lessons
| Endpoint | Middleware chain | Notes |
|---|---|---|
| `GET /lessons/modules/:moduleNo/topics` | `asyncHandler` | Public module topics; resolves assets without persona.
| `GET /lessons/courses/:courseKey/topics` | `asyncHandler` → optional auth | If auth provided, uses tutor persona to resolve assets.
| `GET /lessons/courses/:courseKey/personalization` | `requireAuth` → `asyncHandler` | 404 if course not found.
| `POST /lessons/courses/:courseKey/personalization` | `requireAuth` → `asyncHandler` → zod parse | Persona must be enum.
| `GET /lessons/courses/:courseKey/prompts` | `requireAuth` → `asyncHandler` → zod parse | Suggestions by course/topic.
| `GET /lessons/courses/:courseKey/progress` | `requireAuth` → `asyncHandler` | Returns summary + per lesson.
| `GET /lessons/:lessonId/progress` | `requireAuth` → `asyncHandler` | By topicId.
| `PUT /lessons/:lessonId/progress` | `requireAuth` → `asyncHandler` → zod parse | Upserts progress.

## Cohort Projects
| Endpoint | Middleware chain | Notes |
|---|---|---|
| `GET /cohort-projects/:courseKey` | `requireAuth` → `asyncHandler` → cohort membership check | 403 if not cohort; 404 if no project.

## Assistant (learner)
| Endpoint | Middleware chain | Notes |
|---|---|---|
| `POST /assistant/query` | `requireAuth` → `asyncHandler` | Runs quota + rate limit + RAG; 429 on limit.
| `GET /assistant/session` | `requireAuth` → `asyncHandler` | Returns history for course/topic.

## Persona Profiles
| Endpoint | Middleware chain | Notes |
|---|---|---|
| `GET /persona-profiles/:courseKey/status` | `requireAuth` → `asyncHandler` | Returns `hasProfile`.
| `POST /persona-profiles/:courseKey/analyze` | `requireAuth` → `asyncHandler` → zod parse | AI classification + upsert.

## Quiz
| Endpoint | Middleware chain | Notes |
|---|---|---|
| `GET /quiz/questions` | `asyncHandler` → zod parse | Public question fetch (no auth).
| `GET /quiz/sections/:courseKey` | `requireAuth` → `asyncHandler` | Returns unlock states.
| `POST /quiz/attempts` | `requireAuth` → `asyncHandler` → zod parse | Creates attempt with frozen questions.
| `POST /quiz/attempts/:attemptId/submit` | `requireAuth` → `asyncHandler` → zod parse | Grades and unlocks modules.
| `GET /quiz/progress/:courseKey` | `requireAuth` → `asyncHandler` | Module progress summary.

## Cold Call
| Endpoint | Middleware chain | Notes |
|---|---|---|
| `GET /cold-call/prompts/:topicId` | `requireAuth` → `asyncHandler` → cohort membership check | 403 if not cohort.
| `POST /cold-call/messages` | `requireAuth` → `asyncHandler` → cohort membership check | 409 if already submitted.
| `POST /cold-call/replies` | `requireAuth` → `asyncHandler` → membership + self-reply check | 403 on self reply or no top-level submission.
| `POST /cold-call/stars` | `requireAuth` → `asyncHandler` → membership + self-star check | 403 on self-star/no top-level submission.
| `DELETE /cold-call/stars/:messageId` | `requireAuth` → `asyncHandler` → membership check | 403 if not cohort.

## Activity / Telemetry
| Endpoint | Middleware chain | Notes |
|---|---|---|
| `POST /activity/events` | `requireAuth` → `asyncHandler` → zod parse | Max 50 events.
| `GET /activity/courses/:courseId/learners` | `requireAuth` → `asyncHandler` → `ensureTutorOrAdminAccess` | Access denial throws → global 500.
| `GET /activity/learners/:learnerId/history` | `requireAuth` → `asyncHandler` → zod parse → `ensureTutorOrAdminAccess` | Access denial throws → global 500.

## Tutor Dashboard
| Endpoint | Middleware chain | Notes |
|---|---|---|
| `POST /tutors/login` | `asyncHandler` | Tutor/admin password login.
| `POST /tutors/assistant/query` | `requireAuth` → `requireTutor` → `asyncHandler` → course assignment check | Admin role will fail `requireTutor`.
| `GET /tutors/me/courses` | `requireAuth` → `requireTutor` → `asyncHandler` | Returns assigned courses.
| `GET /tutors/:courseId/enrollments` | `requireAuth` → `requireTutor` → `asyncHandler` → assignment check | 403 if not assigned.
| `GET /tutors/:courseId/progress` | `requireAuth` → `requireTutor` → `asyncHandler` → assignment check | 403 if not assigned.

## Admin
| Endpoint | Middleware chain | Notes |
|---|---|---|
| `GET /admin/tutor-applications` | `requireAuth` → `requireAdmin` → `asyncHandler` | Returns full applications list.
| `POST /admin/tutor-applications/:applicationId/approve` | `requireAuth` → `requireAdmin` → `asyncHandler` | Creates tutor user + course.

## CMS Pages
| Endpoint | Middleware chain | Notes |
|---|---|---|
| `GET /pages/:slug` | `asyncHandler` | Public page content.

## Cart
| Endpoint | Middleware chain | Notes |
|---|---|---|
| `GET /cart` | `requireAuth` → `asyncHandler` | Returns items.
| `POST /cart` | `requireAuth` → `asyncHandler` → zod parse | Adds items.
| `DELETE /cart/items/:courseSlug` | `requireAuth` → `asyncHandler` | Removes item.
| `DELETE /cart` | `requireAuth` → `asyncHandler` | Clears cart.


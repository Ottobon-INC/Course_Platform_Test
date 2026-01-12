# Handoff Pack - Course_Platform_Test

This document is the entry point for any LLM thread that must build a complete mental model of the codebase using documentation only.

## 1) Recommended reading order
1. `README.md`
2. `Course_Platform.md`
3. `CP_Arc.md`
4. `Frontend.md`
5. `docs/project-structure.md`
6. `docs/databaseSchema.md`
7. `docs/project-walkthrough.md`
8. `docs/App Changes.md`
9. `docs/backend-dev-log.md`
10. `task_progress.md`
11. `frontend/README.md` and `backend/README.md`
12. `docs/design_guidelines.md`

## 2) Canonical identifiers and invariants
- Primary course name: AI Native FullStack Developer.
- Primary course slug: `ai-native-fullstack-developer`.
- Legacy slug: `ai-in-web-development` still resolves via backend slug/name resolution.
- RAG source PDF: `AI Native Full Stack Developer.pdf`.
- Frontend dev URL: `http://localhost:5173`.
- Backend dev URL: `http://localhost:4000` (API mounted at `/` and `/api`).

## 3) Frontend routes (from `frontend/src/App.tsx`)
- `/` - LandingPage
- `/become-a-tutor` - BecomeTutorPage
- `/tutors` - TutorDashboardPage (tutor/admin only)
- `/auth/callback` - AuthCallbackPage
- `/course/:id` - CourseDetailsPage
- `/course/:id/enroll` - EnrollmentPage
- `/course/:id/path` - LearningPathPage (study persona questionnaire flow)
- `/course/:id/learn/:lesson` - CoursePlayerPage
- `/course/:id/assessment` - AssessmentPage
- `/course/:id/congrats` - CongratsPage
- `/course/:id/congrats/feedback` - CongratsFeedbackPage
- `/course/:id/congrats/certificate` - CourseCertificatePage
- `*` - NotFound

Notes:
- `TutorLoginPage.tsx` exists but is not wired; tutor login is handled inside `BecomeTutorPage` via `/api/tutors/login`.

## 4) Backend routers and endpoints
Routers are mounted at both `/` and `/api`.

Auth + sessions:
- `POST /auth/login` (tutor/admin password login)
- `GET /auth/google`, `GET /auth/google/callback`
- `POST /auth/google/exchange`, `POST /auth/google/id-token`
- `POST /auth/refresh`, `POST /auth/logout`

Catalog + enrollment:
- `GET /courses`
- `GET /courses/:courseKey`
- `POST /courses/:courseKey/enroll` (supports `?checkOnly=true`)

Lessons + personalization:
- `GET /lessons/modules/:moduleNo/topics`
- `GET /lessons/courses/:courseKey/topics`
- `GET /lessons/courses/:courseKey/personalization`
- `POST /lessons/courses/:courseKey/personalization`
- `GET /lessons/courses/:courseKey/prompts`
- `GET /lessons/courses/:courseKey/progress`
- `GET /lessons/:lessonId/progress`
- `PUT /lessons/:lessonId/progress`

Cohort projects:
- `GET /cohort-projects/:courseKey`

AI tutor (learner):
- `POST /assistant/query`
- `GET /assistant/session`

Persona profile analysis:
- `GET /persona-profiles/:courseKey/status`
- `POST /persona-profiles/:courseKey/analyze`

Quizzes:
- `GET /quiz/questions`
- `GET /quiz/sections/:courseKey`
- `GET /quiz/progress/:courseKey`
- `POST /quiz/attempts`
- `POST /quiz/attempts/:attemptId/submit`

Cold calling:
- `GET /cold-call/prompts/:topicId`
- `POST /cold-call/messages`
- `POST /cold-call/replies`
- `POST /cold-call/stars`
- `DELETE /cold-call/stars/:messageId`

Telemetry + tutor monitor:
- `POST /activity/events`
- `GET /activity/courses/:courseId/learners`
- `GET /activity/learners/:learnerId/history`

Tutor dashboard:
- `POST /tutors/login`
- `POST /tutors/assistant/query`
- `GET /tutors/me/courses`
- `GET /tutors/:courseId/enrollments`
- `GET /tutors/:courseId/progress`

Admin:
- `GET /admin/tutor-applications`
- `POST /admin/tutor-applications/:applicationId/approve`

Other supporting:
- `/cart/*`, `/pages/*`, `/tutor-applications/*`, `/users/*`, `/health`

## 5) Content resolution invariants
- `topics.text_content` can be plain text or a derived JSON layout.
- Derived layout blocks can include `contentKey` values.
- `topic_content_assets` stores the master payloads keyed by `(topic_id, content_key, persona_key)`.
- `lessonsRouter` resolves content keys using the learner tutor persona (`learner_persona_profiles`), falls back to default payloads, and returns resolved blocks to the frontend.
- The frontend should not filter by tutor persona; it renders the resolved JSON it receives.

## 6) Data model focus (see `docs/databaseSchema.md`)
Core learner tables:
- `courses`, `topics`, `topic_progress`, `module_progress`
- `topic_personalization` (study persona: `normal|sports|cooking|adventure`)
- `learner_persona_profiles` (tutor personas for personalization)
- `topic_content_assets` (master content payloads)
- `topic_prompt_suggestions`, `module_prompt_usage`
- `quiz_questions`, `quiz_options`, `quiz_attempts`
- `enrollments`

Cohort + cold calling:
- `cohorts`, `cohort_members`, `cohort_batch_projects`
- `cold_call_prompts`, `cold_call_messages`, `cold_call_stars`

AI tutor + memory:
- `course_chunks` (pgvector embeddings)
- `cp_rag_chat_sessions`, `cp_rag_chat_messages`

Telemetry + tutor monitor:
- `learner_activity_events`

Tutor/admin:
- `tutor_applications`, `tutors`, `course_tutors`

## 7) Runtime constants (code-level truth)
RAG + tutor:
- Vector top-K: 5
- Embedding dims: 1536
- Insert batch size: 50
- Chunk size: 900, overlap: 150
- Rate limit: 8 requests / 60 seconds per user
- Typed prompt quota: 5 per module
- Chat history: last 10 turns; session load limit 40
- Summary starts after 16 messages

Quiz gating:
- Pass threshold: 70%
- Default question limit: 5 (max 20)
- Module cooldown window: 7 days

Auth/session:
- Access token TTL: 900s (default)
- Refresh token TTL: 30d (default)
- Refresh buffer: 60s; min refresh delay: 15s

Telemetry:
- Max events per request: 50
- History query limit max: 100

## 8) Course resolution rules
- `coursesRouter`: resolves by UUID, legacy slug alias, or `courseName` (decoded + hyphen/underscore normalized). Does not use `slug` directly.
- `lessonsRouter`: resolves by UUID, legacy alias, or `courseName` only.
- `assistantRouter` + `quizRouter`: resolve UUID, legacy alias, `slug`, and `courseName`.
- RAG retrieval uses the raw `courseId` passed by the client. It must match `course_chunks.course_id` from ingestion.

## 9) RAG ingestion and imports
- Ingest PDF to pgvector:
  - `cd backend`
  - `npm run rag:ingest "../AI Native Full Stack Developer.pdf" ai-native-fullstack-developer "AI Native FullStack Developer"`
- Defaults in the script still point to the legacy PDF/slug, so pass explicit args when using the new slug.
- Import precomputed embeddings:
  - `npm run rag:import <json>`

## 10) Known legacy wiring
- `AuthPage.tsx` and `TutorLoginPage.tsx` exist but are not wired in `frontend/src/App.tsx`.
- Some frontend constants still reference the legacy slug `ai-in-web-development`. This is safe because the backend resolves the legacy slug.

This handoff should be treated as authoritative for LLM context building.

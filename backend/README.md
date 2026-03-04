# CP_Backend

Express + Prisma API for Course_Platform_Test. This service is mounted at `/` and `/api`.

Primary responsibilities:
- OAuth, tutor login, and session lifecycle.
- Enrollment, cohort allowlist checks, and course catalog.
- Lessons and progress, including derived content resolution via `topic_content_assets`.
- Study personas and learner tutor persona profiles.
- Quizzes, cold calling, and cohort batch projects.
- AI tutor with Async RAG (Job Queue + SSE), prompt suggestions, and chat memory.

Start here:
- `Course_Platform.md` for end-to-end behavior
- `CP_Arc.md` for architecture and router mapping
- `docs/databaseSchema.md` for table definitions
- `docs/LLM-handoff.md` for LLM onboarding

## Addendum - 2026-03-04 (No Previous Lines Removed)
- Verified current runtime architecture: one `frontend/` app and one `backend/` API in this repository.
- Verified async AI flow: request -> `background_jobs` queue -> `aiWorker` processing -> SSE response stream.
- Verified cohort access-state source endpoint: `GET /courses/:courseKey/access-status` returning `isAuthenticated`, `hasApplied`, `isApprovedMember`.
- Verified registration identity linkage: `POST /registrations` normalizes email and resolves/writes `registrations.user_id` using auth-user match or `users.email` lookup.
- Verified course details CTA progression for cohort flow: `Register Now` -> `Apply for Cohort` -> `Application is under review` -> `Start Learning`.


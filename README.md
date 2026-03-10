# Course_Platform_Test

Full-stack course platform (React/Vite frontend + Express/Prisma backend).

Highlights:
- Course player with block-based content layout stored in `topics.text_content` and resolved server-side from `topic_content_assets`.
- Study personas (normal/sports/cooking/adventure) plus learner tutor personas (non_it_migrant, rote_memorizer, english_hesitant, last_minute_panic, pseudo_coder).
- AI tutor with RAG (pgvector), prompt suggestions, and persistent chat memory.
- Cohort allowlist gating, cold calling, quizzes, and cohort batch projects.

Canonical course slug: `ai-native-fullstack-developer` (Legacy alias `ai-in-web-development` supported).

Docs:
- `Course_Platform.md`, `CP_Arc.md`, `Frontend.md`
- `docs/project-structure.md`, `docs/project-walkthrough.md`, `docs/databaseSchema.md`
- `task_progress.md`, `docs/App Changes.md`, `docs/backend-dev-log.md`
- LLM onboarding: `docs/gemini-LLM-handoff.md` and `docs/LLM-handoff.md`

## Addendum - 2026-03-04 (No Previous Lines Removed)
- Verified current runtime architecture: one `frontend/` app and one `backend/` API in this repository.
- Verified async AI flow: request -> `background_jobs` queue -> `aiWorker` processing -> SSE response stream.
- Verified cohort access-state source endpoint: `GET /courses/:courseKey/access-status` returning `isAuthenticated`, `hasApplied`, `isApprovedMember`.
- Verified registration identity linkage: `POST /registrations` normalizes email and resolves/writes `registrations.user_id` using auth-user match or `users.email` lookup.
- Verified course details CTA progression for cohort flow: `Register Now` -> `Apply for Cohort` -> `Application is under review` -> `Start Learning`.

## Addendum - 2026-03-10 (No Previous Lines Removed)
- On-demand completion flow now lives under `/ondemand/:id/congrats/*` with server-backed certificate data.
- Added `course_certificates` table for certificate issuance + feedback metadata.
- Added `GET /api/certificates/:courseKey` and `POST /api/certificates/:courseKey/feedback` endpoints.


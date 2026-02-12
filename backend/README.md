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

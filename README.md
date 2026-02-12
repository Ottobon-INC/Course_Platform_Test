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

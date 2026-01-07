# Course_Platform_Test

Full-stack LearnHub prototype pairing a React + Vite frontend with an Express + Prisma backend. Highlights:

- Single-course marketing funnel that deep-links into the AI Native FullStack Developer curriculum.
- Course player with study personas, cold-calling checkpoint, quizzes that unlock downstream modules, and an AI tutor dock backed by pgvector + OpenAI.
- AI tutor now keeps persistent per-topic memory (chat sessions + message history) and rewrites ambiguous follow-ups before retrieval.
- Google OAuth, JWT sessions, cohort-allowlist enrollment gate, cart, tutor intake, and CMS-backed pages.
- Canonical course slug: `ai-native-fullstack-developer` (legacy `ai-in-web-development` links still resolve via backend slug resolution).
- New (Dec 2025): Learner telemetry and tutor monitor. The course player emits buffered activity events (video interactions, idle signals, quiz status, persona switches, cold-call prompts, etc.). The backend stores them in `learner_activity_events`, exposes `/api/activity/events`, `/api/activity/courses/:courseId/learners`, and `/api/activity/learners/:id/history`, and classifies events into `engaged`, `attention_drift`, and `content_friction` for tutor monitoring.

See `Course_Platform.md`, `CP_Arc.md`, and `task_progress.md` for detailed architecture notes and the changelog. For LLM onboarding, start with `docs/gemini-handoff.md`.

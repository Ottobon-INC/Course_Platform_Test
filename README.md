# Course_Platform_Test

Full-stack LearnHub prototype pairing a React + Vite frontend with an Express + Prisma backend. Highlights:

- Single-course marketing funnel that deep-links into the AI-in-Web-Development curriculum.
- Course player with study personas, cold-calling checkpoint, quizzes that unlock downstream modules, and an AI tutor dock backed by pgvector + OpenAI.
- AI tutor now keeps persistent per-topic memory (chat sessions + message history) and rewrites ambiguous follow-ups before retrieval.
- Google OAuth, JWT sessions, cohort-allowlist enrollment gate, cart, tutor intake, and CMS-backed pages.
- **New (Dec 2025): Learner telemetry & tutor monitor** – the course player now emits buffered activity events (video interactions, idle signals, quiz status, persona switches, cold-call prompts, etc.). The backend stores them in learner_activity_events, exposes /api/activity/events, /api/activity/courses/:courseId/learners, and /api/activity/learners/:id/history, and classifies events into engaged, ttention_drift, and content_friction so tutors can poll for real-time status.

See Course_Platform.md, CP_Arc.md, and task_progress.md for detailed architecture notes and the changelog.

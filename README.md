# Course_Platform_Test

Full-stack learning platform prototype featuring a React + Vite frontend, Express + Prisma backend, Google OAuth, and a Postgres course dataset.

## Current Status (2025-12-02)

- ✅ Neo4j-backed AI tutor is answering directly from course chunks again. The course player now always sends the canonical slug (`ai-in-web-development`) to `/assistant/query`, so vector lookups match the data created by the ingestion script.
- ✅ Dynamic quiz grid still covers all 12 topic-pair assessments from the `quiz_questions` + `quiz_options` tables, and successful attempts continue to unlock downstream modules through `module_progress`.
- ✅ Landing page remains the only public route; every CTA (Google login, enroll, continue learning) deep-links to the course player while unpublished courses show “Coming soon.”
- 🔧 Regression guard: the shared fetch helper merges custom headers with defaults so quiz and tutor requests always include both `Authorization` and `Content-Type: application/json`.

See `Course_Platform.md`, `CP_Arc.md`, and `docs/App Changes.md` for the detailed architecture notes and changelog.

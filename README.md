# Course_Platform_Test

Full-stack learning platform prototype featuring a React + Vite frontend, Express + Prisma backend, Google OAuth, and a Postgres + pgvector course dataset.

## Current Status (2025-12-29)

- ✅ RAG tutor now queries course chunks from Postgres via pgvector, removing Neo4j dependency while keeping slug-based lookup (`ai-in-web-development`).
- ✅ Dynamic quiz grid still covers all 12 topic-pair assessments from the `quiz_questions` + `quiz_options` tables, and successful attempts continue to unlock downstream modules through `module_progress`.
- ✅ Landing page remains the only public route; every CTA (Google login, enroll, continue learning) deep-links to the course player while unpublished courses show “Coming soon.”
- 🔧 Regression guard: the shared fetch helper merges custom headers with defaults so quiz and tutor requests always include both `Authorization` and `Content-Type: application/json`.
- ✅ Cohort allowlist is enforced on enroll only (`cohorts` + `cohort_members` with `batch_no`), while course details/player remain publicly browseable.

See `Course_Platform.md`, `CP_Arc.md`, and `docs/App Changes.md` for the detailed architecture notes and changelog.

# Course_Platform_Test

Full-stack learning platform prototype featuring a React + Vite frontend, Express + Prisma backend, Google OAuth, and a Postgres course dataset.

## Current Status (2025-11-25)

- ✅ Dynamic quiz grid now loads all 12 topic-pair assessments directly from the `quiz_questions` + `quiz_options` tables.
- ✅ Each quiz attempt is persisted with the authenticated learner’s `user_id` and propagates module unlocks via `module_progress`.
- 🔧 Fix summary: frontend API helper now merges caller headers before attaching defaults, so quiz requests always include both `Authorization` and `Content-Type: application/json`. Without that header, Express ignored the payload and Prisma received `NULL/NaN` identifiers, leading to empty quizzes and anonymous attempts.
- ✅ Landing page is now the sole entry point; Google OAuth and all CTA buttons redirect directly to the published course player. Legacy dashboard/cart routes were removed, and non-published course cards show “Coming soon” instead of navigating to missing content.

See `Course_Platform.md`, `CP_Arc.md`, and `docs/App Changes.md` for the detailed architecture notes and changelog.

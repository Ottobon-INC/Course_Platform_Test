# Course Platform Project Structure

## Root
- `.editorconfig`, `.gitignore`, `.replit`: repository-wide tooling defaults.
- `README.md`: high-level onboarding for the whole monorepo.
- `docs/`: documentation bundle (see individual files below).
- `backend/`, `frontend/`, `shared/`, `infrastructure/`, `scripts/`: top-level workspaces described later.

## Frontend (`frontend/`)
- `index.html`, `vite.config.ts`, `tsconfig.json`: Vite + TypeScript spa bootstrapping.
- `src/main.tsx`, `src/App.tsx`: entry pipeline wiring React Router, global providers, and layout shell.
- `src/pages/`: route-level screens that drive the visual experience:
  - `DashboardPage.tsx`: hero dashboard showing enrolled courses, progress, and quick stats.
  - `AuthCallbackPage.tsx`: handles Google OAuth callback, stores tokens, and routes back into the app.
  - `AuthPage.tsx`: login + signup UI with animated background, tabs, and form flows.
  - `CoursePlayerPage.tsx`: two-column lesson player (video/text) with topic sidebar.
  - `EnrollmentPage.tsx`, `CartPage.tsx`, `AssessmentPage.tsx`: purchase funnel, cart, and quiz experience.
  - `pages/examples/`: frozen design references for demo scenarios.
  - `pages/not-found.tsx`: fallback 404 screen.
- `src/components/`: reusable UI parts used to compose screens.
  - `components/layout/`: navigation shell, sidebars, headers, and responsive wrappers.
  - `components/dashboard/`, `components/courses/`, `components/auth/`: feature-focused widgets such as course cards, progress tiles, login hero, etc.
  - `components/examples/`: self-contained demo blocks mirroring mockups.
  - `components/ui/`: shadcn/ui primitives (buttons, dialogs, tabs, tables) that power styling.
- `src/hooks/`: custom hooks (`use-toast`, `use-mobile`) that centralize behavior for toasts & responsive checks.
- `src/lib/`: utility helpers like `queryClient.ts` (TanStack Query setup) and `utils.ts` (class name helpers).
- `public/`: static assets (favicons, logos, placeholder cover images).
- `.env.example`: front-end environment sample (API URLs, feature flags).
- `package.json`: npm workspace for Vite app (React, Tailwind, shadcn/ui stack).

## Backend (`backend/`)
- `src/`: Express + TypeScript API.
  - `server.ts`: boots the HTTP server after loading validated environment settings.
  - `app.ts`: Express app wiring JSON + URL-encoded parsing, routes, and global error handler.
  - `routes/`: modular endpoints:
    - `health.ts`: liveliness check (includes Postgres connectivity probe).
    - `auth.ts`: Google OAuth code exchange, JWT issuance, refresh, and logout.
    - `users.ts`: authenticated profile lookup (`/users/me`).
    - `quiz.ts`: dynamic quiz sections/progress plus attempt start/submit endpoints backed by `quiz_questions`, `quiz_options`, `quiz_attempts`, and `module_progress`.
  - `middleware/requireAuth.ts`: verifies bearer JWTs and attaches auth context to requests.
  - `services/`: shared business utilities:
    - `prisma.ts`: Prisma client singleton bound to `DATABASE_URL`.
    - `googleOAuth.ts`: OAuth2 client helper to build the consent URL & fetch Google profile data.
    - `userService.ts`: creates or returns users sourced from Google accounts.
    - `sessionService.ts`: manages JWT creation, rotation, hashing, and persistence in `user_sessions`.
  - `config/env.ts`: Zod-backed environment parsing for DB, Google OAuth, and JWT settings.
  - `utils/asyncHandler.ts`: promise-aware Express handler wrapper.
  - `utils/oauthState.ts`: signs/validates OAuth state cookies used during the Google redirect handshake.
- `prisma/schema.prisma`: Prisma data model mirroring the production Postgres schema (users, courses, topics, user_sessions, etc.).
- `.env.example`: backend environment sample pre-filled with Google + Postgres credentials and JWT placeholders.
- `package.json`, `tsconfig*.json`, `vitest.config.ts`: tooling for TypeScript build, tests, and development.

## Shared (`shared/`)
- `schema.ts`: cross-cutting TypeScript types (e.g., course, topic, enrollment contracts) used by both front and back for consistency.

## Infrastructure (`infrastructure/`)
- `docker-compose.yml`: local orchestration for Postgres + pgAdmin.
- `README.md`: boot instructions for the infrastructure stack.
- `db/`: folder reserved for database assets/backups.

## Scripts (`scripts/`)
- `dev.sh`, `dev.ps1`: convenience scripts to launch both frontend and backend dev servers together.

## Documentation (`docs/`)
- `project-structure.md` *(this file)*: living map explaining how code maps to the visual experience.
- `backend-dev-log.md`: chronological backend implementation log (see that file for step-by-step backend changes).
- `databaseSchema.md`, `design_guidelines.md`, `legacy/`: historical references and design notes.

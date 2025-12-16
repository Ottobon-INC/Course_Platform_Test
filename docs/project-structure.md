# Course Platform Project Structure

Use this guide to understand where each major feature lives. Pair it with `Course_Platform.md` for behavioural context.

## Root
- `CP_Arc.md`, `Course_Platform.md`, `docs/` – documentation packet to share with external reviewers or LLMs.
- `task_progress.md`, `docs/App Changes.md` – running task log + changelog.
- `backend/`, `frontend/`, `shared/`, `infrastructure/`, `scripts/` – main workspaces.

## Frontend (`frontend/`)
- `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json` – tooling.
- `src/main.tsx` (bootstraps React), `src/App.tsx` (routes + providers).
- `src/pages/`
  - `LandingPage.tsx` – marketing hero + CTA entry.
  - `CourseDetailsPage.tsx` – curriculum timeline, MetaLearn modal, auto enrollment + questionnaire redirection.
  - `CoursePlayerPage.tsx` – orchestrates modules, progress, personas, quiz tab, tutor chat.
  - `CourseCertificatePage.tsx` – certificate preview & upgrade CTA.
  - `EnrollmentPage.tsx`, `AssessmentPage.tsx` – purchase/quiz scaffolds.
  - `AuthCallbackPage.tsx` – Google OAuth redirect handler.
  - `BecomeTutorPage.tsx`, `AboutPage.tsx`, `not-found.tsx` – supporting routes.
- `src/components/`
  - `CourseSidebar.tsx` – module accordion + progress stats.
  - `LessonTabs.tsx` – study material/practice tabs with Markdown rendering.
  - `ChatBot.tsx` – AI tutor dock (suggestions, typed prompts, quota messaging).
  - `layout/` (SiteHeader, SiteLayout) and `ui/` (shadcn primitives) reused across pages.
- `src/lib/queryClient.ts`, `src/lib/api.ts` – fetch wrappers.
- `src/utils/session.ts` – session storage, refresh heartbeat, subscribe/unsubscribe API.

## Backend (`backend/`)
- `src/server.ts`, `src/app.ts` – Express bootstrap.
- `src/routes/`
  - `auth.ts` – Google OAuth + JWT lifecycle.
  - `courses.ts` – catalog fetch + POST enroll.
  - `lessons.ts` – topic aggregation, progress CRUD, personas, curated prompts.
  - `quiz.ts` – sections/progress/attempts/submit endpoints.
  - `assistant.ts` – RAG tutor with rate limiting and prompt quotas.
  - `cart.ts`, `pages.ts`, `tutorApplications.ts`, `users.ts`, `health.ts` – supporting routes.
- `src/services/`
  - `sessionService.ts`, `googleOAuth.ts`, `userService.ts` – auth helpers.
  - `enrollmentService.ts` – ensures unique enrollments.
  - `promptUsageService.ts` – typed prompt quota helpers.
  - `cartService.ts`, `prisma.ts` – commerce + DB helpers.
- `src/rag/`
  - `neo4jClient.ts` / `openAiClient.ts` / `ragService.ts` / `rateLimiter.ts` / `usageLogger.ts` / `textChunker.ts` / `pii.ts`.
- `prisma/schema.prisma`, `prisma/migrations/*` – data model + migrations.
- `scripts/ingestCourseContent.ts` – CLI entry to chunk the PDF, generate embeddings, and load them into Neo4j.

## Shared (`shared/`)
- `schema.ts` – placeholder for future shared types between the SPA and API.

## Infrastructure (`infrastructure/`)
- `docker-compose.yml` – Postgres + pgAdmin stack for local development.
- `README.md` – instructions for running the infrastructure layer.

## Docs (`docs/`)
- `App Changes.md`, `backend-dev-log.md`, `databaseSchema.md`, `design_guidelines.md`, `project-walkthrough.md`, `project-structure.md` (this file).
- `legacy/` – archived drizzle/Express files kept for reference during the migration.

## Scripts (`scripts/`)
- `dev.sh`, `dev.ps1` – convenience wrappers to start frontend + backend concurrently.

With this map you can quickly locate the React components, Express routers, and documentation needed to trace any feature end to end.

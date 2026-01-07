# Course Platform Project Structure

Use this guide to understand where each major feature lives. Pair it with `Course_Platform.md` for behavioural context.

## Root
- `CP_Arc.md`, `Course_Platform.md`, `README.md`, `docs/` – documentation packet to share with external reviewers or LLMs.
- `task_progress.md`, `docs/App Changes.md` – running task log + changelog.
- `AI Native Full Stack Developer.pdf` – source material for RAG ingestion.
- `backend/`, `frontend/` – main workspaces.

Optional: JSON exports for `rag:import` are stored outside the repo and loaded via `backend/scripts/importCourseChunks.ts` when needed.

## Frontend (`frontend/`)
- `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json` – tooling.
- `src/main.tsx` (bootstraps React), `src/App.tsx` (routes + providers).
- `src/pages/`
  - `LandingPage.tsx` – marketing hero + CTA entry.
  - `CourseDetailsPage.tsx` – curriculum timeline, Ottolearn modal, auto enrollment + questionnaire redirection.
  - `CoursePlayerPage.tsx` – orchestrates modules, progress, personas, quiz tab, tutor chat.
  - `CourseCertificatePage.tsx` – certificate preview & upgrade CTA.
  - `EnrollmentPage.tsx`, `AssessmentPage.tsx` – purchase/quiz scaffolds.
  - `AuthCallbackPage.tsx` – Google OAuth redirect handler.
  - `BecomeTutorPage.tsx`, `AboutPage.tsx`, `not-found.tsx` – supporting routes.
- `src/components/`
  - `CourseSidebar.tsx` – module accordion + progress stats.
  - `LessonTabs.tsx` – study material/practice tabs with Markdown rendering.
  - `ColdCalling.tsx` – blind-response cohort prompt with threaded replies and star reactions.
  - `ChatBot.tsx` – AI tutor dock (suggestions, typed prompts, quota messaging, chat history hydration).
  - `layout/` (SiteHeader, SiteLayout) and `ui/` (shadcn primitives) reused across pages.
- `src/lib/queryClient.ts`, `src/lib/api.ts` – fetch wrappers.
- `src/utils/session.ts` – session storage, refresh heartbeat, subscribe/unsubscribe API.

## Backend (`backend/`)
- `src/server.ts`, `src/app.ts` – Express bootstrap.
- `src/routes/`
  - `auth.ts` – Google OAuth + JWT lifecycle.
  - `courses.ts` – catalog fetch + POST enroll (cohort eligibility enforced here).
  - `lessons.ts` – topic aggregation, progress CRUD, personas, curated prompts.
  - `quiz.ts` – sections/progress/attempts/submit endpoints.
  - `assistant.ts` – RAG tutor with rate limiting, prompt quotas, and persistent chat memory (`/assistant/session`).
  - `coldCall.ts` – cold calling prompts, blind-response gating, replies, and stars.
  - `cart.ts`, `pages.ts`, `tutorApplications.ts`, `users.ts`, `health.ts` – supporting routes.
- `src/services/`
  - `sessionService.ts`, `googleOAuth.ts`, `userService.ts` – auth helpers.
  - `cohortAccess.ts` – cohort allowlist checks keyed by course + email/userId.
  - `enrollmentService.ts` – ensures unique enrollments.
  - `promptUsageService.ts` – typed prompt quota helpers.
  - `cartService.ts`, `prisma.ts` – commerce + DB helpers.
- `src/rag/`
  - `openAiClient.ts` / `ragService.ts` / `rateLimiter.ts` / `usageLogger.ts` / `textChunker.ts` / `pii.ts`.
- `prisma/schema.prisma`, `prisma/migrations/*` – data model + migrations.
  - `prisma/migrations/20251230_add_cold_calling` – cold calling prompt + message tables.
  - `prisma/migrations/20251231_add_rag_chat_memory` – persistent tutor chat sessions + messages (cp_ prefixed).
- `scripts/ingestCourseContent.ts` – CLI entry to chunk the PDF, generate embeddings, and load them into Postgres pgvector.
- `scripts/importCourseChunks.ts` – import precomputed embeddings from JSON exports into `course_chunks`.

## Docs (`docs/`)
- `gemini-handoff.md` – recommended reading order + system invariants for LLM onboarding.
- `App Changes.md`, `backend-dev-log.md`, `databaseSchema.md`, `design_guidelines.md`, `project-walkthrough.md`, `project-structure.md` (this file).

With this map you can quickly locate the React components, Express routers, and documentation needed to trace any feature end to end.

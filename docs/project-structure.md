# Course Platform Project Structure

Use this guide to locate major features quickly. Pair it with `Course_Platform.md` for behavior details.

## Root
- `CP_Arc.md`, `Course_Platform.md`, `README.md`, `Frontend.md` - high-level docs.
- `task_progress.md`, `docs/App Changes.md` - task log and changelog.
- `AI Native Full Stack Developer.pdf` - source material for RAG ingestion.
- `backend/`, `frontend/` - main workspaces.
- `docs/` - documentation bundle.

Optional: JSON exports for `rag:import` live outside the repo and can be loaded with `backend/scripts/importCourseChunks.ts`.

## Frontend (`frontend/`)
- `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`.
- `src/main.tsx` (bootstraps React), `src/App.tsx` (routes + providers).
- `src/pages/`
  - `LandingPage.tsx` - marketing hero + CTA entry.
  - `CourseDetailsPage.tsx` - curriculum timeline + enrollment modal.
  - `CoursePlayerPage.tsx` - main learning experience (blocks, quizzes, tutor chat).
  - `CourseCertificatePage.tsx` - certificate preview.
  - `TutorDashboardPage.tsx`, `BecomeTutorPage.tsx`, `AuthCallbackPage.tsx`.
- `src/components/`
  - `CourseSidebar.tsx` - module accordion + progress.
  - `ColdCalling.tsx` - cohort prompt + replies.
  - `SimulationExercise.tsx` - simulation block rendering.
  - `CohortProjectModal.tsx` - project brief modal.
  - `ChatBot.tsx` - AI tutor dock.
- `src/lib/api.ts`, `src/lib/queryClient.ts` - API helpers.
- `src/utils/session.ts`, `src/utils/telemetry.ts` - session heartbeat and telemetry buffer.

## Backend (`backend/`)
- `src/server.ts`, `src/app.ts` - Express bootstrap.
- `src/routes/`
  - `auth.ts` - Google OAuth + JWT lifecycle.
  - `courses.ts` - catalog fetch + enroll.
  - `lessons.ts` - topics, personalization, progress, content resolution.
  - `cohortProjects.ts` - cohort project lookup.
  - `quiz.ts`, `assistant.ts`, `coldCall.ts`, `activity.ts`, `personaProfiles.ts`.
  - `tutors.ts`, `admin.ts`, `cart.ts`, `pages.ts`, `users.ts`, `health.ts`.
- `src/services/`
  - `sessionService.ts`, `googleOAuth.ts`, `enrollmentService.ts`.
  - `cohortAccess.ts`, `promptUsageService.ts`.
  - `personaProfileService.ts`, `personaPromptTemplates.ts`.
  - `prisma.ts`.
- `src/rag/` - OpenAI client, pgvector retrieval, rate limiter, usage logging.
- `prisma/schema.prisma`, `prisma/migrations/*`
  - `20251230_add_cold_calling`
  - `20251231_add_rag_chat_memory`
  - `20260108_add_cohort_batch_projects`
  - `20260109_add_topic_content_assets`
- `scripts/ingestCourseContent.ts`, `scripts/importCourseChunks.ts`

## Docs (`docs/`)
- `LLM-handoff.md`, `gemini-LLM-handoff.md` - LLM onboarding.
- `databaseSchema.md`, `design_guidelines.md`.
- `project-structure.md`, `project-walkthrough.md`.
- `backend-dev-log.md`, `App Changes.md`.

This map should stay updated whenever new components or routes are added.

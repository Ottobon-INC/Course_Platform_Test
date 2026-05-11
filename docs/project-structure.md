# Course Platform Project Structure

Use this guide to locate major features quickly. Pair it with `Course_Platform.md` for behavior details.

## Root
- `CP_Arc.md`, `Course_Platform.md`, `README.md`, `Frontend.md` - high-level docs.
- `task_progress.md`, `docs/App Changes.md` - task log and changelog.
- `Web Dev using AI Course Content.pdf` and `AI Native Full Stack Developer.pdf` - RAG source PDFs.
- `backend/`, `frontend/` - main workspaces.
- `docs/` - documentation bundle.

Optional: JSON exports for `rag:import` live outside the repo and can be loaded with `backend/scripts/importCourseChunks.ts`.

## Frontend (`frontend/`)
- `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`.
- `src/main.tsx` (bootstraps React), `src/App.tsx` (routes + providers).
- `src/pages/`
  - Marketing: `LandingPage.tsx`, `MethodologyPage.tsx`, `MoreInfoPage.tsx`, `CohortPage.tsx`, `OnDemandPage.tsx`, `WorkshopPage.tsx`.
  - Course flow: `CourseDetailsPage.tsx`, `LearningPathPage.tsx`, `CoursePlayerPage.tsx`, `CongratsPage.tsx`, `CongratsFeedbackPage.tsx`, `CourseCertificatePage.tsx`.
  - On-demand flow: `OnDemandPlayerPage.tsx` (self-paced player).
  - Auth + tutor: `AuthCallbackPage.tsx`, `BecomeTutorPage.tsx`, `TutorDashboardPage.tsx`.
  - Legacy/not wired: `EnrollmentPage.tsx`, `AssessmentPage.tsx`, `AuthPage.tsx`, `TutorLoginPage.tsx`, `CoursesPage.tsx`, `DashboardPage.tsx`, `CartPage.tsx`, `AboutPage.tsx`.
- `src/components/`
  - `Navbar.tsx`, `HeroCarousel.tsx`, `OfferingsNavbar.tsx`.
  - `CourseSidebar.tsx` (module accordion + progress).
  - `ColdCalling.tsx` (cohort prompt + replies).
  - `SimulationExercise.tsx` (simulation block rendering).
  - `CohortProjectModal.tsx` (project brief modal).
  - `ChatBot.tsx` (AI tutor dock).
  - `QuizCard.tsx` (quiz UI + timer display).
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
- `scripts/ingestCourseContent.ts`, `scripts/importCourseChunks.ts`.

## Docs (`docs/`)
- `LLM-handoff.md`, `gemini-LLM-handoff.md` - LLM onboarding.
- `databaseSchema.md`, `design_guidelines.md`.
- `project-structure.md`, `project-walkthrough.md`.
- `backend-dev-log.md`, `App Changes.md`.

This map should stay updated whenever new components or routes are added.

## Addendum - 2026-03-04 (No Previous Lines Removed)
- Verified current runtime architecture: one `frontend/` app and one `backend/` API in this repository.
- Verified async AI flow: request -> `background_jobs` queue -> `aiWorker` processing -> SSE response stream.
- Verified cohort access-state source endpoint: `GET /courses/:courseKey/access-status` returning `isAuthenticated`, `hasApplied`, `isApprovedMember`.
- Verified registration identity linkage: `POST /registrations` normalizes email and resolves/writes `registrations.user_id` using auth-user match or `users.email` lookup.
- Verified course details CTA progression for cohort flow: `Register Now` -> `Apply for Cohort` -> `Application is under review` -> `Start Learning`.


---

## Codebase Sync Addendum (2026-05-11)

This document has been synchronized with the current implementation state of the Course Platform codebase.
If any older section in this file conflicts with this addendum, treat this addendum as the latest behavior.

### Current implementation truths

1. API surface is exposed both at root routes and mirrored `/api/*` routes in the backend app bootstrap.
2. Assessment engine is `assessment_id`-centric:
   - Live assessment definitions are in `course_assessments`.
   - Topic/module assessment pointers are resolved from `topic_content_assets.payload.assessment_id`.
   - Attempt tracking uses `quiz_attempts.assessment_id` as canonical identity (legacy `topic_pair_index` is retained for compatibility paths).
3. Course Player Page supports topic-inline quiz rendering (`Topic Assessment`) when a quiz block exists in topic block JSON and its `contentKey` resolves to a quiz asset pointer.
4. Module-level assessment flow is resolved from module/topic-linked quiz pointers and assessment definitions; latest attempt status is derived per assessment.
5. Student Dashboard assignment flow is API-driven (`/api/assignments/learner`, `/api/assignments/upload`, `/api/assignments/submit`) and filtered by learner enrollments/cohort access.
6. Persona implementation is mixed by design in current code:
   - Backend persona services and tutoring prompts use five keys: `non_it_migrant`, `rote_memorizer`, `english_hesitant`, `last_minute_panic`, `pseudo_coder`.
   - A separate learner-path questionnaire flow still contains legacy persona labels (`sports`, `cooking`, `adventure`, `normal`) and should be treated as an independent path unless migrated.
7. Content loading supports both structured block JSON and legacy plain-text topic payloads; rendering/queries must account for both shapes.

### Operational documentation rule

When updating docs or onboarding teams, use backend route/service behavior and frontend page behavior in the running code as the source of truth over historical notes.

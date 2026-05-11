# Frontend Documentation

This document describes the Ottolearn frontend: architecture, layout rules, and the responsibilities of major pages.

## 1. Tech stack
- React 18 + TypeScript
- Vite build tooling
- Tailwind CSS + shadcn/ui components
- TanStack Query for data fetching
- Wouter for routing
- Session heartbeat in `src/utils/session.ts`

## 2. Directory structure (key areas)
```
frontend/
  src/
    pages/
      LandingPage.tsx
      CourseDetailsPage.tsx
      CoursePlayerPage.tsx
      CourseCertificatePage.tsx
      LearningPathPage.tsx
      CongratsPage.tsx
      CongratsFeedbackPage.tsx
      CohortPage.tsx
      OnDemandPage.tsx
      OnDemandPlayerPage.tsx
      WorkshopPage.tsx
      MethodologyPage.tsx
      MoreInfoPage.tsx
      BecomeTutorPage.tsx
      TutorDashboardPage.tsx
      AuthCallbackPage.tsx
      EnrollmentPage.tsx (legacy)
      AssessmentPage.tsx (legacy)
      AuthPage.tsx (not wired)
      TutorLoginPage.tsx (not wired)
      CoursesPage.tsx (not wired)
      DashboardPage.tsx (not wired)
      CartPage.tsx (not wired)
      AboutPage.tsx (not wired)
      not-found.tsx
      examples/* (local examples)
    components/
      Navbar.tsx
      HeroCarousel.tsx
      OfferingsNavbar.tsx
      CourseSidebar.tsx
      ColdCalling.tsx
      SimulationExercise.tsx
      CohortProjectModal.tsx
      ChatBot.tsx
      LandingChatBot.tsx (RAG-powered, limits: 5/10, sessionStorage persistence, smart redirects)
      QuizCard.tsx
    lib/
      api.ts
      queryClient.ts
    utils/
      session.ts
      telemetry.ts
```

## 3. Primary routes (App.tsx)
- `/` - LandingPage
- `/become-a-tutor` - BecomeTutorPage
- `/methodology` - MethodologyPage
- `/more-info` - MoreInfoPage
- `/our-courses/cohort` - CohortPage
- `/our-courses/on-demand` - OnDemandPage
- `/our-courses/workshops` - WorkshopPage
- `/tutors` - TutorDashboardPage
- `/auth/callback` - AuthCallbackPage
- `/course/:id` - CourseDetailsPage
- `/course/:id/enroll` - EnrollmentPage (legacy)
- `/course/:id/path` - LearningPathPage
- `/course/:id/learn/:lesson` - CoursePlayerPage
- `/ondemand/:id/learn/:lesson` - OnDemandPlayerPage
- `/course/:id/assessment` - AssessmentPage (legacy)
- `/ondemand/:id/congrats` - CongratsPage
- `/ondemand/:id/congrats/feedback` - CongratsFeedbackPage
- `/ondemand/:id/congrats/certificate` - CourseCertificatePage
- `*` - NotFound

Notes:
- The marketing navbar is hidden on `/course/*` routes.
- Auth/Enrollment legacy flows are present but not used by the landing CTA.

## 4. Authentication flow (frontend)
- Navbar "Login / Signup" triggers Google OAuth via `buildApiUrl('/auth/google')`.
- Global redirect logic in `App.tsx` ensures backend targeting (port 4000) from any route.
- `AuthCallbackPage` stores the session and redirects to `postLoginRedirect` (from sessionStorage).
- `utils/session.ts` stores session tokens in localStorage and handles refresh/heartbeat.

## 5. Course player behavior (CoursePlayerPage)
- Loads all topics from `GET /lessons/courses/:courseKey/topics`.
- If `topics.text_content` is JSON, `parseContentBlocks` renders `text`, `image`, `video`, and `ppt` blocks.
- `data.variants` can hold study persona variants; the UI chooses the active persona copy.
- If `text_content` is plain text, the UI selects `text_content_*` based on the study persona.
- The Study Material header appears before the first text block.
- If the first block is video, the video renders at the top with no header above it.
- If the first text block is followed by an image block, the image attaches under that text card.
- Read Mode collapses the video block with a smooth transition and auto-scrolls to the top.
- Cohort Project button sits in the course player header and opens `CohortProjectModal` after calling `/cohort-projects/:courseKey`.
- Cold calling and simulation exercises render as dedicated sections.
- Quiz timer is configured in `CoursePlayerPage.tsx` (currently 150 seconds).

## 5a. On-demand player behavior (OnDemandPlayerPage)
- Loads all topics from `GET /lessons/courses/:courseKey/topics` and keeps navigation unlocked.
- Uses a dedicated scroll container that resets to top on lesson change.
- Renders the simulation block with `SimulationExercise` (theme support allows dark styling for On-Demand while Cohort remains light).
- Shows a "View Congrats" CTA once on-demand progress reaches 100%.

## 5b. On-demand completion flow
- `CongratsPage` submits feedback to `POST /api/certificates/:courseKey/feedback?programType=ondemand`.
- `CourseCertificatePage` reads `GET /api/certificates/:courseKey?programType=ondemand` and overlays the learner name + course title onto the certificate image.

## 6. API helpers
- `buildApiUrl` in `src/lib/api.ts` uses `VITE_API_BASE_URL`.
- `session.ts` provides `readStoredSession`, refresh logic, and logout helpers.

## 7. Running the frontend
```bash
cd frontend
npm install
npm run dev
```

Build:
```bash
npm run build
```

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

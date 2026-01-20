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
- `/course/:id/assessment` - AssessmentPage (legacy)
- `/course/:id/congrats` - CongratsPage
- `/course/:id/congrats/feedback` - CongratsFeedbackPage
- `/course/:id/congrats/certificate` - CourseCertificatePage
- `*` - NotFound

Notes:
- The marketing navbar is hidden on `/course/*` routes.
- Auth/Enrollment legacy flows are present but not used by the landing CTA.

## 4. Authentication flow (frontend)
- Navbar "Login / Signup" triggers Google OAuth via `/auth/google`.
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

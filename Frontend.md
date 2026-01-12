# Frontend Documentation

This document describes the Ottolearn frontend: architecture, layout rules, and the responsibilities of major pages.

## 1. Tech stack
- React 18 + TypeScript
- Vite build tooling
- Tailwind CSS + shadcn/ui components
- TanStack Query for data fetching
- Wouter for routing
- Session heartbeat in `src/utils/session.ts`

## 2. Directory structure
```
frontend/
  src/
    pages/
      LandingPage.tsx
      CourseDetailsPage.tsx
      CoursePlayerPage.tsx
      CourseCertificatePage.tsx
      TutorDashboardPage.tsx
      AuthCallbackPage.tsx
    components/
      CourseSidebar.tsx
      ColdCalling.tsx
      SimulationExercise.tsx
      CohortProjectModal.tsx
      ChatBot.tsx
    lib/
      api.ts
      queryClient.ts
    utils/
      session.ts
      telemetry.ts
```

## 3. Primary routes
- `/` - LandingPage
- `/course/:id` - CourseDetailsPage
- `/course/:id/learn/:lesson` - CoursePlayerPage
- `/course/:id/congrats/certificate` - CourseCertificatePage
- `/tutors` - TutorDashboardPage
- `/become-a-tutor` - BecomeTutorPage

## 4. Course player behavior (CoursePlayerPage)
- Loads all topics from `GET /lessons/courses/:courseKey/topics`.
- If `topics.text_content` is JSON, `parseContentBlocks` renders block types: `text`, `image`, `video`, `ppt`.
- The Study Material header appears immediately before the first text block.
- If the first block is video, the video renders at the top with no header above it.
- If the first text block is followed by an image block, the image attaches under that text card.
- Read Mode collapses the video block with a smooth transition and auto-scrolls to the top.
- Cohort Project button sits in the course player header and opens `CohortProjectModal` after calling `/cohort-projects/:courseKey`.
- Study persona variants (sports/cooking/adventure) are switched client-side using `topic_personalization`.

Note: Tutor persona selection is resolved on the backend via `topic_content_assets`. The frontend never filters by tutor persona.

## 5. Running the frontend
```bash
cd frontend
npm install
npm run dev
```

Build:
```bash
npm run build
```

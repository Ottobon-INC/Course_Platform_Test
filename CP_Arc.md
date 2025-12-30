# Course Platform Architecture Overview

This document is the architectural deep dive for the Course Platform application. It explains how the React SPA, Express API, relational storage, and AI tutor systems interact so another engineer or an external LLM can reason about every layer end to end.

## 1. Runtime Topology

| Layer | Technology | Endpoint(s) | Responsibilities |
| --- | --- | --- | --- |
| Presentation | React 18 + Vite + Wouter + TanStack Query + shadcn/ui | http://localhost:5173 | Landing site, enrollment funnel, study persona workflow, course player, quizzes, tutor chat, certificate preview |
| Application/API | Node 20, Express, TypeScript | http://localhost:4000 (mounted at / and /api) | OAuth, enrollment writes, lesson data, progress tracking, tutor prompts, quiz orchestration, CMS content, tutor applications |
| Data | PostgreSQL via Prisma | DATABASE_URL | Users, sessions, courses, topics, personalisation, quizzes, module progress, CMS pages |
| Knowledge Store | PostgreSQL + pgvector | DATABASE_URL | Stores embedded course chunks for the AI tutor |
| ML Provider | OpenAI APIs | HTTPS | Embedding generation and chat completions for the mentor and tutor copilot |

```
Browser ---- JSON fetch ----> React SPA (5173) ---- REST calls ----> Express API (4000)
   ^                                                                  |
   |                                                                  +--> Prisma -> PostgreSQL
   |                                                                  +--> Postgres pgvector -> course_chunks
   |                                                                  +--> OpenAI client
```

## 2. Client Layer (React SPA)

### Stack and global wiring
- App.tsx mounts QueryClientProvider, toast/tooltip providers, and the Wouter router.
- Session helpers in frontend/utils/session.ts persist tokens, refresh them proactively, and notify listeners when a session expires.
- frontend/lib/queryClient.ts centralises API calls with automatic header merging, fixing the historic quiz bug where caller headers overwrote Content-Type.

### Critical screens
- LandingPage – the single marketing surface with CTAs that jump straight into the featured course.
- CourseDetailsPage – displays live module/topic metadata, checks cohort eligibility before opening the MetaLearn Protocol modal, enrolls via POST /courses/:slug/enroll, and routes through /course/:slug/path when personalization is missing.
- EnrollmentPage and AssessmentPage – host the purchase funnel and the quiz tab visuals.
- CoursePlayerPage – hydrates the entire curriculum, renders the sidebar, handles lesson progress, exposes the study-persona dialog, plays videos/slides, embeds the tutor dock, and hosts the cold-calling checkpoint after study text.
- CourseSidebar – searchable curriculum tree with module collapse/expand, inline completion toggles, and a progress meter that counts quiz-passed modules.
- ChatBot – enforces auth, exposes curated prompt suggestions, and surfaces the tutor responses.
- CourseCertificatePage – gated post-completion view reminding learners that payment unlocks a clean certificate.

### Study persona UX
- Personas: normal, sports, cooking, adventure.
- Learners who first chose Standard narration can launch the questionnaire mid-course; the questionnaire matches the enrollment UI and stores the preference via topic_personalization plus a local personaHistoryKey.
- Returning learners who once picked a persona always see both Standard plus their saved persona. Switching back to Standard never discards the stored persona, so a logout/login cycle still exposes both options.
- Lesson guides read persona-specific fields such as textContentSports, so toggling narration swaps copy instantly.

## 3. Application Layer (Express API)

### Bootstrap and middleware
- backend/src/app.ts configures JSON + URL encoded parsing, cookie parsing, CORS restricted by FRONTEND_APP_URLS, and mounts each router under both / and /api.
- middleware/requireAuth.ts validates JWTs and injects the user context for protected routes.
- utils/asyncHandler.ts keeps each router lean while surfacing structured error responses.

### Router catalog
| Router | Key endpoints | Highlights |
| --- | --- | --- |
| authRouter | /auth/google, /auth/google/callback, /auth/google/exchange, /auth/google/id-token, /auth/refresh, /auth/logout | Full Google OAuth + JWT lifecycle with hashed refresh tokens |
| coursesRouter | GET /courses, GET /courses/:courseKey, POST /courses/:courseKey/enroll | Slug/UUID/name resolution, cohort allowlist checks, and idempotent enrollment writes (supports `?checkOnly=true`) |
| lessonsRouter | GET /modules/:moduleNo/topics, GET /courses/:courseKey/topics, GET/PUT /:lessonId/progress, personalization endpoints, prompt suggestions | Delivers curriculum, tracks progress, stores narrator personas, and exposes curated prompt trees |
| quizRouter | GET /quiz/questions, GET /quiz/sections/:courseKey, GET /quiz/progress/:courseKey, POST /quiz/attempts, POST /quiz/attempts/:attemptId/submit | Drives the module cadence (cooldowns, dependencies) and writes quiz_attempts/module_progress |
| assistantRouter | POST /assistant/query | Authenticated tutor endpoint with typed-prompt quotas stored in module_prompt_usage |
| coldCallRouter | GET /cold-call/prompts/:topicId, POST /cold-call/messages, POST /cold-call/replies, POST/DELETE /cold-call/stars | Blind-response prompts, threaded replies, and cohort-only reactions |
| cartRouter, pagesRouter, tutorApplicationsRouter, usersRouter, healthRouter | Supporting CRUD plus liveness checks |

### Supporting services
- sessionService.ts, googleOAuth.ts, enrollmentService.ts, promptUsageService.ts, cartService.ts keep router handlers declarative.
- cohortAccess.ts centralizes cohort allowlist enforcement keyed by course and email/userId.
- rag/* modules encapsulate the OpenAI + pgvector plumbing, PII scrubbing, chunking, rate limiting, and usage logging.

## 4. Data & Integration Layer

### PostgreSQL via Prisma
Major model groups (see backend/prisma/schema.prisma):
- Accounts – users, user_sessions, tutor_applications, tutors, course_tutors.
- Catalog – courses, topics, simulation_exercises, page_content.
- Cohort access – cohorts, cohort_members (batch_no for grouping).
- Cold calling – cold_call_prompts, cold_call_messages, cold_call_stars.
- Knowledge store – course_chunks (pgvector embeddings for RAG).
- Progress & enrollment – enrollments, topic_progress, module_progress.
- Commerce – cart_items, cart_lines.
- Personalisation & curated prompts – topic_personalization, topic_prompt_suggestions, module_prompt_usage.
- Assessments – quiz_questions, quiz_options, quiz_attempts.
All Prisma models map snake_case columns to camelCase fields so TypeScript consumers remain ergonomic without sacrificing SQL clarity.

### pgvector and OpenAI
- scripts/ingestCourseContent.ts reads the canonical PDF, chunks it (900 chars with 150 overlap), generates embeddings (1,536 dims), and writes rows into course_chunks in Postgres.
- scripts/importCourseChunks.ts can import precomputed embeddings from JSON exports (e.g., Neo4j dumps) without re-embedding.
- Tutor queries embed the learner question, fetch the top K contexts from Postgres using pgvector similarity search, craft a grounded prompt, and call generateAnswerFromContext() to get the final completion.
- Typed prompts increment the module_prompt_usage counter only after OpenAI succeeds so quota tracking stays fair.

## 5. Experience Flows

### 5.1 Sign-in and heartbeat
1. Landing CTA -> /auth/google (backend sets state cookie and redirects to Google).
2. Callback exchange -> backend issues access + refresh JWTs, stores hashed refresh token, forwards to /auth/callback with redirect info.
3. AuthCallbackPage persists the session and rehydrates whichever route initiated auth.
4. Components subscribe to the session heartbeat; if refresh fails they immediately drop to a signed-out state.

### 5.2 Enrollment and personalisation
1. CourseDetails page reads the same /lessons/courses/:slug/topics feed used by the player, so marketing and delivery stay in sync.
2. Clicking Enroll runs POST /courses/:slug/enroll?checkOnly=true; cohort-eligible learners see the modal, while non-eligible learners receive a cohort access toast.
3. Accepting the MetaLearn modal ensures the session, calls POST /courses/:slug/enroll, and persists an enrollments row.
4. If the learner has never set a persona, CourseDetails forwards to /course/:slug/path?lesson=... to run the questionnaire before unlocking /course/:slug/learn/:lesson.
5. CoursePlayerPage fetches /lessons/courses/:slug/personalization; saved personas lock the dialog to Standard vs saved persona, while first-time learners see the full question flow.

### 5.3 Lesson playback
1. Modules (including Module 0 Introduction) are grouped client-side from the topics response and rendered inside CourseSidebar.
2. Each lesson carries PPT/video URLs and persona-specific guide fields. normalizeVideoUrl hardens every YouTube link to an embed-friendly URL with share/keyboard controls disabled.
3. PUT /lessons/:lessonId/progress persists percentage and completion timestamps; the UI updates optimistically and reconciles once the API responds.

### 5.4 Quiz gating
1. Quiz tab loads /quiz/sections/:slug plus /quiz/progress/:slug to determine which topic pairs are unlocked, passed, or pending cooldown.
2. POST /quiz/attempts freezes the randomised question set; POST /quiz/attempts/:id/submit grades it, stores answers, and, when appropriate, marks module_progress.quiz_passed.
3. MODULE_WINDOW_DURATION (currently 7d) drives cooldown windows; responses surface moduleLockedDueToCooldown and moduleCooldownUnlockAt so the UI can warn learners when to return.

### 5.5 Cold calling checkpoint
1. After study material renders, the UI fetches `/cold-call/prompts/:topicId`.
2. Until the learner submits, the prompt displays as a blind-response input.
3. After submission, the cohort feed appears with stars and nested replies.
4. Self-replies and self-stars are blocked server-side.

### 5.6 Tutor prompts
1. The chat dock surfaces both typed prompts and CMS-authored suggestion trees.
2. Typed prompts require { courseId: slug, moduleNo, question }; hitting the quota returns HTTP 429 with a friendly message.
3. Suggestions (topic_prompt_suggestions) can include predefined answers as well as follow-up prompts, enabling deterministic Q&A when desired.
4. Successful answers log usage (rag/usageLogger.ts) for future analytics.

### 5.7 Certificate preview
1. Once quizzes report passed modules, the CTA routes to /course/:slug/certificate.
2. The certificate page reads stored name/title defaults, renders a blurred preview, and hosts a Razorpay placeholder to illustrate the paid upgrade path.

## 6. Environment, Build, Deployment

- frontend/.env.example - set VITE_API_BASE_URL against the backend URL plus any analytics keys.
- backend/.env.example - configure DB URL, OAuth credentials, JWT secrets, comma-delimited FRONTEND_APP_URLS, and OpenAI credentials.
- Typical dev loop:
  1. npm install inside both frontend/ and backend/.
  2. npx prisma migrate dev to sync the schema.
  3. (Optional) start a local Postgres + pgAdmin stack if you maintain one.
  4. npm run dev for the API and npm run dev for the SPA.
  5. npm run rag:ingest <pdf> <slug> "<Course Title>" whenever the source material changes.
  6. npm run rag:import <json> when reusing precomputed embeddings.
- Production: host Express wherever Node 20 is supported (Render, Fly, Railway), point DATABASE_URL to the managed Postgres instance with pgvector enabled, deploy the Vite dist/ bundle to a static host, and ensure OAuth redirect URIs plus FRONTEND_APP_URLS match the deployed domains.

## 7. Observability and Next Steps

- Extend structured logging beyond the tutor usage logger to cover enrollment, personalization saves, and quiz submissions.
- Automate Postgres backups before the next release.
- Add Vitest + Supertest coverage for the personalization and quiz routers plus component tests for the persona modal.
- Promote cooldown duration and prompt quotas to env overrides if we need course-specific tuning.

## Appendix: Repository Tree

```
./
    CP_Arc.md
    Course_Platform.md
    README.md
    task_progress.md
    Web Dev using AI Course Content.pdf
    neo4j_query_table_data_2025-12-24.json
backend/
    prisma/
        schema.prisma
        migrations/...
    scripts/
        ingestCourseContent.ts
        importCourseChunks.ts
    src/
        app.ts
        server.ts
        routes/
            assistant.ts
            auth.ts
            cart.ts
            coldCall.ts
            courses.ts
            health.ts
            lessons.ts
            pages.ts
            quiz.ts
            tutorApplications.ts
            users.ts
        services/
            cartService.ts
            cohortAccess.ts
            enrollmentService.ts
            googleOAuth.ts
            promptUsageService.ts
            sessionService.ts
            userService.ts
        rag/
            openAiClient.ts
            pii.ts
            ragService.ts
            rateLimiter.ts
            textChunker.ts
            usageLogger.ts
frontend/
    src/
        App.tsx
        components/
            CourseSidebar.tsx
            ChatBot.tsx
            ColdCalling.tsx
            LessonTabs.tsx
            layout/
            ui/
        pages/
            CourseDetailsPage.tsx
            CoursePlayerPage.tsx
            CourseCertificatePage.tsx
            EnrollmentPage.tsx
            AuthCallbackPage.tsx
            BecomeTutorPage.tsx
            LandingPage.tsx
            AssessmentPage.tsx
            not-found.tsx
        hooks/
            use-toast.ts
        lib/
            api.ts
            queryClient.ts
        utils/
            session.ts
docs/
    App Changes.md
    backend-dev-log.md
    databaseSchema.md
    design_guidelines.md
    project-structure.md
    project-walkthrough.md
```

Use this artefact together with Course_Platform.md, docs/databaseSchema.md, and docs/project-walkthrough.md whenever you need to brief teammates or an external LLM on the full platform.

# Course Platform — Complete Mind Model

> **Generated**: 2026-02-10 | **Source**: Full codebase scan of all 36 documentation files + all backend/frontend source code

---

## Table of Contents
1. [Project Identity](#1-project-identity)
2. [Runtime Topology](#2-runtime-topology)
3. [Technology Stack](#3-technology-stack)
4. [Environment & Configuration](#4-environment--configuration)
5. [Repository Structure](#5-repository-structure)
6. [Backend Architecture](#6-backend-architecture)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Database Schema — Complete](#8-database-schema--complete)
9. [Content Pipeline — Master/Derived JSON](#9-content-pipeline--masterderived-json)
10. [Persona Systems](#10-persona-systems)
11. [Authentication & Sessions](#11-authentication--sessions)
12. [Enrollment & Cohort Gating](#12-enrollment--cohort-gating)
13. [Course Player & Content Rendering](#13-course-player--content-rendering)
14. [AI Tutor — RAG Pipeline](#14-ai-tutor--rag-pipeline)
15. [Quiz Engine & Module Gating](#15-quiz-engine--module-gating)
16. [Cold Calling System](#16-cold-calling-system)
17. [Telemetry & Tutor Monitor](#17-telemetry--tutor-monitor)
18. [Tutor Dashboard](#18-tutor-dashboard)
19. [Landing Chatbot](#19-landing-chatbot)
20. [Cohort Batch Projects](#20-cohort-batch-projects)
21. [Registration System (New/Undocumented)](#21-registration-system-newundocumented)
22. [API Contracts — Full Reference](#22-api-contracts--full-reference)
23. [Middleware Map](#23-middleware-map)
24. [End-to-End Flow Traces](#24-end-to-end-flow-traces)
25. [Canonical Identifiers & Course Resolution](#25-canonical-identifiers--course-resolution)
26. [Seed & Ingestion Pipeline](#26-seed--ingestion-pipeline)
27. [Runtime Constants](#27-runtime-constants)
28. [Database Invariants & Constraints](#28-database-invariants--constraints)
29. [Legacy & Unwired Inventory](#29-legacy--unwired-inventory)
30. [Design Guidelines](#30-design-guidelines)
31. [Deployment & Operations](#31-deployment--operations)
32. [Known Issues & Risks](#32-known-issues--risks)

---

## 1. Project Identity

- **Product name**: Ottolearn-branded Course Platform
- **Purpose**: Full-stack learning experience for browsing, enrolling, and completing AI-focused courses
- **Primary course**: "AI Native Full Stack Developer"
- **Canonical course slug (DB seed)**: `ai-in-web-development`
- **Canonical course UUID (seed)**: `f26180b2-5dda-495a-a014-ae02e63f172f`
- **Marketing label (display-only)**: `ai-native-fullstack-developer`
- **Monorepo structure**: `frontend/` + `backend/` workspaces in a single repo

---

## 2. Runtime Topology

```
Browser → React SPA (Vite, :5173) → Express API (:4000) → Prisma → PostgreSQL (Supabase)
                                          |→ pgvector (course_chunks)
                                          |→ OpenAI API (embeddings + chat completions)
```

- Frontend dev URL: `http://localhost:5173`
- Backend dev URL: `http://localhost:4000`
- API mounted at `/` **and** mirrored under `/api` for frontend prefix consistency
- CORS allowlist from `FRONTEND_APP_URLS` (comma-separated origins)
- Allowed headers: `Content-Type`, `Authorization`
- Credentials enabled; OAuth state uses secure cookie

---

## 3. Technology Stack

| Concern | Implementation |
|---|---|
| Frontend runtime | React 18, TypeScript, Vite |
| Routing | Wouter |
| Data fetching | TanStack Query |
| UI system | Tailwind CSS, shadcn/ui components, Lucide icons |
| State/session | localStorage + heartbeat (`utils/session.ts`) |
| Backend runtime | Node 20, Express 4, TypeScript |
| Validation | Zod schemas on route handlers |
| ORM & DB | Prisma 6, PostgreSQL (Supabase compatible) |
| Auth | Google OAuth 2.0, JWT access + refresh tokens |
| Vector store | PostgreSQL + pgvector extension |
| AI provider | OpenAI (`text-embedding-3-small` + `gpt-3.5-turbo` default) |
| Password hashing | scrypt (`scrypt:<salt>:<hash>`) |

---

## 4. Environment & Configuration

### Backend (`.env`)
| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `4000` | Express listen port |
| `DATABASE_URL` | **Yes** | — | Postgres connection string |
| `GOOGLE_CLIENT_ID` | **Yes** | — | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | **Yes** | — | OAuth client secret |
| `GOOGLE_REDIRECT_URI` | **Yes** | — | OAuth callback URI |
| `JWT_SECRET` | **Yes** | — | Access token signing key |
| `JWT_REFRESH_SECRET` | **Yes** | — | Refresh token signing key |
| `JWT_ACCESS_TOKEN_TTL_SECONDS` | No | `900` | Access token TTL |
| `JWT_REFRESH_TOKEN_TTL_DAYS` | No | `30` | Refresh token TTL |
| `OPENAI_API_KEY` | **Yes** | — | OpenAI API key |
| `LLM_MODEL` | No | `gpt-3.5-turbo` | Chat model |
| `EMBEDDING_MODEL` | No | `text-embedding-3-small` | Embedding model |
| `FRONTEND_APP_URLS` | No | `http://localhost:5173` | CORS origins |

### Frontend (`.env`)
| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Used by `buildApiUrl()` in `src/lib/api.ts` |
| `VITE_API_URL` | Used in `App.tsx` Navbar OAuth redirect (must stay aligned) |

> **Warning**: `VITE_API_URL` and `VITE_API_BASE_URL` can drift. Both must point to port 4000.

---

## 5. Repository Structure

```
./
├── CP_Arc.md                          # Architecture overview
├── Course_Platform.md                 # Full project documentation
├── Frontend.md                        # Frontend-specific docs
├── README.md                          # Quick onboarding
├── task_progress.md                   # Change log
├── AI Native Full Stack Developer.pdf # RAG source (alternate)
├── Web Dev using AI Course Content.pdf# RAG source (default)
├── temp_patch.py                      # Utility script
│
├── docs/                              # Documentation bundle (9 files)
│   ├── LLM-handoff.md                 # LLM onboarding (authoritative)
│   ├── gemini-LLM-handoff.md          # Identical copy for Gemini
│   ├── databaseSchema.md              # Schema diagrams
│   ├── project-structure.md           # File map
│   ├── project-walkthrough.md         # Learner journey trace
│   ├── technical-requirements.md      # Engineering requirements
│   ├── design_guidelines.md           # Visual/UX rules
│   ├── backend-dev-log.md             # Backend changelog
│   └── App Changes.md                 # Overall changelog
│
├── LLM required extra docs/          # Deep-dive specs (17 files)
│   ├── api-contracts.md               # 432-line API reference
│   ├── middleware-map.md              # Route→middleware→error chains
│   ├── flow-traces.md                 # 9 end-to-end flow traces
│   ├── content-json-spec.md           # Block layout + resolution spec
│   ├── auth-and-permissions.md        # Token format, roles, enforcement
│   ├── ai-tutor-spec.md              # RAG pipeline + memory + quotas
│   ├── db-invariants.md              # All table constraints
│   ├── quiz-engine-spec.md           # Quiz selection, scoring, gating
│   ├── quiz-data-requirements.md     # Min data for correct unlocks
│   ├── cold-calling-spec.md          # State machine + rules
│   ├── telemetry-spec.md             # Event types + status derivation
│   ├── tutor-dashboard-spec.md       # UI features + copilot
│   ├── canonical-identifiers.md      # Course ID compatibility matrix
│   ├── seed-and-ingestion.md         # Seed data + RAG import
│   ├── legacy-inventory.md           # Unwired components
│   ├── deployment-notes.md           # Runtime topology + env
│   └── external-sql-ddl.md           # DDL for quiz tables
│
├── backend/
│   ├── src/
│   │   ├── server.ts                  # Express bootstrap (listen)
│   │   ├── app.ts                     # createApp() — 19 routers mounted
│   │   ├── config/
│   │   │   └── env.ts                 # Environment parsing
│   │   ├── middleware/
│   │   │   ├── requireAuth.ts         # JWT verification → req.auth
│   │   │   └── (requireTutor, requireAdmin inline in routes)
│   │   ├── routes/                    # 20 route files
│   │   │   ├── auth.ts                # 8.3KB — OAuth + JWT lifecycle
│   │   │   ├── courses.ts             # 4.9KB — Catalog + enrollment
│   │   │   ├── lessons.ts             # 22.7KB — Topics, progress, content resolution
│   │   │   ├── assistant.ts           # 15.7KB — AI tutor (RAG + memory)
│   │   │   ├── landingAssistant.ts    # 1.7KB — Public sales chatbot
│   │   │   ├── quiz.ts                # 27.3KB — Quiz engine + module gating
│   │   │   ├── coldCall.ts            # 13.2KB — Cold calling
│   │   │   ├── activity.ts            # 4.2KB — Telemetry + monitor
│   │   │   ├── tutors.ts              # 8.8KB — Tutor dashboard
│   │   │   ├── admin.ts               # 4.2KB — Admin endpoints
│   │   │   ├── personaProfiles.ts     # 4.2KB — Persona analysis
│   │   │   ├── cohortProjects.ts      # 5.4KB — Batch projects
│   │   │   ├── cart.ts                # 2.7KB — Cart CRUD
│   │   │   ├── users.ts              # 1.0KB — /users/me
│   │   │   ├── pages.ts              # 0.9KB — CMS pages
│   │   │   ├── health.ts             # 0.6KB — Health check
│   │   │   ├── tutorApplications.ts  # 1.9KB — Public tutor apps
│   │   │   ├── registrations.ts      # 4.7KB — NEW: Registration flow
│   │   │   ├── dashboard.ts          # 10.8KB — NEW: Dashboard data
│   │   │   └── lessons.ts.bak        # Legacy backup (unused)
│   │   ├── services/                  # 13 service files
│   │   │   ├── prisma.ts             # Prisma client singleton
│   │   │   ├── sessionService.ts     # Session CRUD + token rotation
│   │   │   ├── googleOAuth.ts        # Google OAuth helpers
│   │   │   ├── enrollmentService.ts  # Enrollment writes
│   │   │   ├── cohortAccess.ts       # Cohort membership resolution
│   │   │   ├── personaProfileService.ts # LLM persona classification
│   │   │   ├── personaPromptTemplates.ts # Persona prompt text
│   │   │   ├── promptUsageService.ts # Typed prompt quota tracking
│   │   │   ├── activityEventService.ts # Telemetry ingestion + status derivation
│   │   │   ├── cartService.ts        # Cart operations
│   │   │   ├── userService.ts        # User lookups
│   │   │   ├── landingKnowledge.ts   # NEW: Landing bot context
│   │   │   └── tutorInsights.ts      # NEW: Tutor copilot snapshots
│   │   ├── rag/                       # 6 RAG modules
│   │   │   ├── ragService.ts         # Core: embeddings, retrieval, prompt building
│   │   │   ├── openAiClient.ts       # OpenAI API wrapper
│   │   │   ├── rateLimiter.ts        # Per-user rate limiting
│   │   │   ├── textChunker.ts        # PDF chunking (900/150)
│   │   │   ├── pii.ts               # PII scrubbing (email, phone)
│   │   │   └── usageLogger.ts       # RAG usage JSON logging
│   │   └── utils/
│   │       ├── asyncHandler.ts       # Express async error wrapper
│   │       └── (other utils)
│   ├── prisma/
│   │   ├── schema.prisma             # 624 lines, 28+ models
│   │   ├── seed.ts                   # Seed script
│   │   └── migrations/
│   │       ├── 20251230_add_cold_calling
│   │       ├── 20251231_add_rag_chat_memory
│   │       ├── 20260108_add_cohort_batch_projects
│   │       └── 20260109_add_topic_content_assets
│   └── scripts/
│       ├── ingestCourseContent.ts    # PDF → pgvector ingestion
│       └── importCourseChunks.ts     # JSON → pgvector import
│
└── frontend/
    ├── src/
    │   ├── main.tsx                   # React bootstrap
    │   ├── App.tsx                    # 201 lines — Routes + providers
    │   ├── index.css                  # 21.8KB — Global styles
    │   ├── pages/                     # 26 page components
    │   │   ├── LandingPage.tsx        # 66.4KB — Marketing + LandingChatBot
    │   │   ├── CoursePlayerPage.tsx    # 96.5KB — Core course player
    │   │   ├── CourseDetailsPage.tsx   # 27.7KB — Course detail + enrollment
    │   │   ├── TutorDashboardPage.tsx  # 37.7KB — Tutor dashboard
    │   │   ├── Strudent_Dashboard.tsx  # 36.6KB — NEW: Student dashboard
    │   │   ├── BecomeTutorPage.tsx     # 34.2KB — Tutor application form
    │   │   ├── CohortPage.tsx         # 30.2KB — Cohort offerings
    │   │   ├── WorkshopPage.tsx       # 22.0KB — Workshop offerings
    │   │   ├── CartPage.tsx           # 22.4KB — Cart (not wired)
    │   │   ├── DashboardPage.tsx      # 40.3KB — Dashboard (not wired)
    │   │   ├── MoreInfoPage.tsx       # 19.3KB — More info
    │   │   ├── CoursesPage.tsx        # 18.7KB — Courses (not wired)
    │   │   ├── OnDemandPage.tsx       # 15.3KB — On-demand offerings
    │   │   ├── LearningPathPage.tsx   # 14.5KB — Persona questionnaire
    │   │   ├── AuthPage.tsx           # 13.1KB — Auth (not wired)
    │   │   ├── AssessmentPage.tsx     # 12.7KB — Assessment (legacy)
    │   │   ├── CongratsPage.tsx       # 10.8KB — Completion congrats
    │   │   ├── AboutPage.tsx          # 10.0KB — About (not wired)
    │   │   ├── RegistrationPage.tsx   # 8.6KB — NEW: Multi-stage registration
    │   │   ├── MethodologyPage.tsx    # 8.2KB — Methodology
    │   │   ├── EnrollmentPage.tsx     # 6.0KB — Enrollment (legacy)
    │   │   ├── CourseCertificatePage.tsx # 5.1KB — Certificate preview
    │   │   ├── TutorLoginPage.tsx     # 4.2KB — Tutor login (not wired)
    │   │   ├── AuthCallbackPage.tsx   # 3.6KB — OAuth callback handler
    │   │   ├── CongratsFeedbackPage.tsx # 1.2KB — Feedback
    │   │   └── not-found.tsx          # 0.7KB — 404 page
    │   ├── components/                # 80+ components
    │   │   ├── ChatBot.tsx            # 10.4KB — AI tutor dock
    │   │   ├── LandingChatBot.tsx     # 18.5KB — Landing page sales bot
    │   │   ├── ColdCalling.tsx        # 20.2KB — Cold call UI
    │   │   ├── CourseSidebar.tsx      # 14.2KB — Module accordion + progress
    │   │   ├── VideoPlayer.tsx        # 12.3KB — Video embed player
    │   │   ├── EnrollmentGateway.tsx  # 13.9KB — Enrollment modal
    │   │   ├── SimulationExercise.tsx # 7.7KB — Simulation block
    │   │   ├── LessonTabs.tsx         # 8.7KB — Lesson tab navigation
    │   │   ├── QuizCard.tsx           # 4.6KB — Quiz UI + timer
    │   │   ├── AssessmentResults.tsx  # 4.8KB — Assessment results
    │   │   ├── PersonaProfileModal.tsx # 3.0KB — Persona analysis modal
    │   │   ├── CohortProjectModal.tsx # 2.5KB — Project brief modal
    │   │   ├── ThemeToggle.tsx        # 1.6KB — Theme switcher
    │   │   ├── layout/               # 6 layout components (Navbar, ScrollToTop, etc.)
    │   │   ├── landing/              # Landing page sub-components
    │   │   ├── registration/         # 6 registration sub-components
    │   │   └── ui/                   # 48 shadcn/ui primitives
    │   ├── lib/
    │   │   ├── api.ts                # buildApiUrl() helper
    │   │   ├── queryClient.ts        # TanStack Query client
    │   │   └── (4 other utils)
    │   ├── utils/
    │   │   ├── session.ts            # Session storage, refresh, heartbeat
    │   │   └── telemetry.ts          # Event buffer + flush
    │   ├── constants/                # 3 constant files
    │   ├── hooks/                    # 2 custom hooks
    │   ├── types/                    # 4 type definition files
    │   └── styles/                   # 1 style file
    └── DOCKER_DEPLOYMENT.md          # Nginx-based build/deploy
```

---

## 6. Backend Architecture

### 6.1 App Bootstrap (`app.ts`)
`createApp()` builds the Express app with:
1. CORS configured from `FRONTEND_APP_URLS` (dynamic origin validation)
2. `cookieParser()` for OAuth state cookies
3. `express.json()` and `express.urlencoded()` for body parsing
4. 19 routers mounted at root level
5. All 19 routers **mirrored** under `/api/*` via an `apiRouter`
6. Global error handler: catches unhandled errors → `500 { message: "Internal server error" }`

### 6.2 Router Matrix (19 active routers)

| Router | Mount Path | File Size | Key Responsibilities |
|---|---|---|---|
| `healthRouter` | `/health` | 0.6KB | DB connectivity check |
| `authRouter` | `/auth` | 8.3KB | Google OAuth redirect/callback, token refresh, logout, tutor/admin login |
| `usersRouter` | `/users` | 1.0KB | `/users/me` profile endpoint |
| `coursesRouter` | `/courses` | 4.9KB | Catalog fetch, course resolution, enrollment + cohort access gate |
| `lessonsRouter` | `/lessons` | 22.7KB | Topics, personalization CRUD, progress CRUD, **content resolution** |
| `assistantRouter` | `/assistant` | 15.7KB | AI tutor chat (RAG + memory + quotas + follow-up rewrite) |
| `landingAssistantRouter` | `/landing-assistant` | 1.7KB | Public sales chatbot with RAG |
| `quizRouter` | `/quiz` | 27.3KB | Question selection, attempts, submissions, module gating, cooldowns |
| `coldCallRouter` | `/cold-call` | 13.2KB | Blind-response prompts, threaded replies, star reactions |
| `activityRouter` | `/activity` | 4.2KB | Telemetry event ingestion + tutor monitor |
| `tutorsRouter` | `/tutors` | 8.8KB | Tutor login, ME courses, enrollments, progress, copilot |
| `adminRouter` | `/admin` | 4.2KB | Tutor application approval + course creation |
| `personaProfilesRouter` | `/persona-profiles` | 4.2KB | LLM-based persona analysis + upsert |
| `cohortProjectsRouter` | `/cohort-projects` | 5.4KB | Per-batch project brief lookup |
| `cartRouter` | `/cart` | 2.7KB | Cart CRUD (add, remove, clear, list) |
| `tutorApplicationsRouter` | `/tutor-applications` | 1.9KB | Public tutor application submission |
| `pagesRouter` | `/pages` | 0.9KB | CMS page content by slug |
| `registrationsRouter` | `/registrations` | 4.7KB | **NEW**: Multi-stage registration flow |
| `dashboardRouter` | `/dashboard` | 10.8KB | **NEW**: Dashboard data endpoints |

### 6.3 Services Layer (13 files)

| Service | Purpose |
|---|---|
| `prisma.ts` | Prisma client singleton |
| `sessionService.ts` | Session CRUD, JWT rotation, refresh token hashing, session deletion |
| `googleOAuth.ts` | Google OAuth helpers (code exchange, token verification) |
| `enrollmentService.ts` | Enrollment upsert |
| `cohortAccess.ts` | Cohort membership resolution (email/userId match, userId backfill) |
| `personaProfileService.ts` | LLM-based persona classification (calls OpenAI) |
| `personaPromptTemplates.ts` | Prompt text templates per persona key |
| `promptUsageService.ts` | Typed prompt quota tracking per module |
| `activityEventService.ts` | Telemetry event ingestion, status derivation (engaged/drift/friction) |
| `cartService.ts` | Cart item operations (raw SQL for table creation) |
| `userService.ts` | User lookups by ID |
| `landingKnowledge.ts` | **NEW**: Context builder for landing sales chatbot |
| `tutorInsights.ts` | **NEW**: `buildTutorCourseSnapshot()` for copilot prompts |

### 6.4 RAG Module (6 files)

| File | Purpose |
|---|---|
| `ragService.ts` | Core: `askCourseAssistant()`, `fetchRelevantContexts()`, `buildPrompt()`, `replaceCourseChunks()` |
| `openAiClient.ts` | OpenAI API wrapper: `createEmbedding()`, `generateAnswerFromContext()`, `rewriteFollowUpQuestion()`, `summarizeConversation()` |
| `rateLimiter.ts` | In-memory per-user rate limiting (8 req/60s) |
| `textChunker.ts` | PDF text chunking (900 chars, 150 overlap) |
| `pii.ts` | Regex-based PII scrubbing (emails, phone numbers) |
| `usageLogger.ts` | JSON stdout logging for RAG usage |

### 6.5 Middleware

| Middleware | Location | Behavior |
|---|---|---|
| `requireAuth` | `middleware/requireAuth.ts` | Extracts `Authorization: Bearer <token>`, verifies JWT, attaches `req.auth = { userId, sessionId, jwtId, role }`. Returns 401 on missing/expired/invalid token. |
| `requireTutor` | Inline in routes | Checks `req.auth.role === "tutor"`. Returns 403 if not. **Admin tokens fail this check.** |
| `requireAdmin` | Inline in routes | Checks `req.auth.role === "admin"`. Returns 403 if not. |
| `asyncHandler` | `utils/asyncHandler.ts` | Wraps async route handlers to catch promise rejections and forward to Express error handler. |
| `ensureTutorOrAdminAccess` | Inline service check | Verifies tutor/admin is assigned to course. **Throws** on denial → bubbles to global 500 handler. |

### 6.6 Key Backend Functions

**Content Resolution** (`lessons.ts`):
- `parseContentLayout()` — Attempts JSON parse of `topics.text_content`, validates blocks
- `buildAssetIndex()` — Maps `topic_content_assets` by `"personaKey|contentKey"` key
- `resolveContentLayout()` — Two modes: contentKey mode (asset lookup) and inline mode (persona filtering)
- `normalizeVideoUrl()` — Converts YouTube URLs to `/embed/` format
- `resolveCourseId()` — Resolves UUID, legacy slug, or courseName to course UUID

**AI Tutor** (`assistant.ts`):
- `shouldRewriteFollowUp()` — Detects ambiguous questions (≤80 chars, starts with follow-up phrase, contains pronouns)
- `ensureChatSession()` — Upserts chat session by `(userId, courseId, topicId)`
- `loadChatContext()` — Loads summary + last 10 turns + last assistant message
- `maybeUpdateChatSummary()` — Triggers summary generation when messages ≥ 16

**Quiz Engine** (`quiz.ts`):
- `loadQuestionSet()` — Random question selection from `quiz_questions` via raw SQL
- `buildModuleStates()` — Computes unlock/cooldown state for all modules
- `upsertModuleProgress()` — Updates `module_progress` on quiz pass
- `getMaxTopicPairIndex()` — Determines final pair for module pass check
- `buildQuizSections()` — Builds flattened section unlock state for frontend

---

## 7. Frontend Architecture

### 7.1 Routing (`App.tsx`)

| Path | Component | Status |
|---|---|---|
| `/` | `LandingPage` | Active — includes `LandingChatBot` |
| `/become-a-tutor` | `BecomeTutorPage` | Active |
| `/methodology` | `MethodologyPage` | Active |
| `/more-info` | `MoreInfoPage` | Active |
| `/our-courses/cohort` | `CohortPage` | Active |
| `/our-courses/on-demand` | `OnDemandPage` | Active |
| `/our-courses/workshops` | `WorkshopPage` | Active |
| `/registration` | `RegistrationPage` | **NEW** — multi-stage |
| `/registration/:programType` | `RegistrationPage` | **NEW** |
| `/registration/:programType/:courseSlug` | `RegistrationPage` | **NEW** |
| `/registration/:programType/:courseSlug/assessment` | `RegistrationPage` | **NEW** |
| `/registration/:programType/:courseSlug/success` | `RegistrationPage` | **NEW** |
| `/course/:id/assessment` | `AssessmentPage` | Legacy |
| `/course/:id/enroll` | `EnrollmentPage` | Legacy |
| `/course/:id/learn/:lesson` | `CoursePlayerPage` | Active — core player |
| `/course/:id/congrats/certificate` | `CourseCertificatePage` | Active |
| `/course/:id/congrats/feedback` | `CongratsFeedbackPage` | Active |
| `/course/:id/congrats` | `CongratsPage` | Active |
| `/course/:id` | `CourseDetailsPage` | Active |
| `/student-dashboard` | `StudentDashboardPage` | **NEW** |
| `/auth/callback` | `AuthCallbackPage` | Active |
| `/tutors` | `TutorDashboardPage` | Active |
| `*` | `NotFound` | Fallback |

**Navbar hiding**: Navbar is hidden when `location` starts with `/course/`, `/registration`, or equals `/student-dashboard`.

### 7.2 Key Pages

**`CoursePlayerPage.tsx`** (96.5KB — largest file):
- Hydrates topics from `GET /lessons/courses/:courseKey/topics`
- Parses `text_content` JSON → renders blocks sequentially
- Study Material header before first text block; video-first layouts skip header
- First text block can attach adjacent image block
- Read Mode: collapses video with smooth height/opacity transition + auto-scroll
- Cohort Project button → fetches `/cohort-projects/:courseKey` → opens modal
- Cold calling and simulation exercise sections rendered per topic
- Quiz timer: 150 seconds
- Study persona toggle (from `data.variants`)
- Telemetry events emitted throughout

**`LandingPage.tsx`** (66.4KB):
- Marketing hero sections, methodology preview, course offerings
- `<LandingChatBot />` embedded for visitor support

**`TutorDashboardPage.tsx`** (37.7KB):
- Course selector from `/tutors/me/courses`
- Enrollment roster, progress table, telemetry status badges (auto-refresh 30s)
- Learner timeline, tutor copilot chat

### 7.3 Key Components

| Component | Size | Purpose |
|---|---|---|
| `ColdCalling.tsx` | 20.2KB | Full cold calling UI: blind response → cohort feed → replies → stars |
| `LandingChatBot.tsx` | 18.5KB | RAG-powered sales bot: personalized greetings, smart redirects (`<<ACTION:URL>>`), session persistence, 5 guest/10 user turn limits |
| `CourseSidebar.tsx` | 14.2KB | Module accordion with progress indicators and topic navigation |
| `EnrollmentGateway.tsx` | 13.9KB | Enrollment modal with cohort gate |
| `VideoPlayer.tsx` | 12.3KB | YouTube embed player with URL normalization |
| `ChatBot.tsx` | 10.4KB | AI tutor dock: prompt suggestions, typed input, history scroll |
| `LessonTabs.tsx` | 8.7KB | Tab navigation within lessons |
| `SimulationExercise.tsx` | 7.7KB | Simulation block rendering |
| `QuizCard.tsx` | 4.6KB | Quiz UI with timer display |
| `PersonaProfileModal.tsx` | 3.0KB | Tutor persona analysis survey |
| `CohortProjectModal.tsx` | 2.5KB | Project brief modal (title, tagline, description, notes) |
| `ThemeToggle.tsx` | 1.6KB | Dark/light theme switcher |

### 7.4 Lib / Utils

| File | Purpose |
|---|---|
| `lib/api.ts` | `buildApiUrl(path)` — prepends `VITE_API_BASE_URL` |
| `lib/queryClient.ts` | TanStack Query client configuration |
| `utils/session.ts` | `readStoredSession()`, `ensureSessionFresh()`, `subscribeToSession()`, `resetSessionHeartbeat()`, `logoutAndRedirect()` — refresh buffer 60s, min delay 15s |
| `utils/telemetry.ts` | Event buffer (flush every 4s or at 20 events), posts to `/activity/events` |

---

## 8. Database Schema — Complete

### 8.1 Prisma-managed models (28+ models, 624 lines)

**Core Entities:**

| Model | Table | PK | Key Fields |
|---|---|---|---|
| `User` | `users` | `user_id` (UUID) | `email` (unique), `fullName`, `role` (learner/tutor/admin), `passwordHash`, `picture`, `provider` (google/local) |
| `Course` | `courses` | `course_id` (UUID) | `slug` (unique), `courseName`, `description`, `imageUrl`, `isPublished`, `numModules`, `legacyCourseAlias` |
| `Topic` | `topics` | `topic_id` (UUID) | `courseId`, `moduleName`, `moduleNo`, `topicNumber`, `topicName`, `videoUrl`, `textContent`, `readingTimeMinutes`, `order` |
| `Enrollment` | `enrollments` | `enrollment_id` (UUID) | `userId` + `courseId` (unique), `enrolledAt`, `completedAt` |
| `TopicProgress` | `topic_progress` | `progress_id` (UUID) | `userId`, `topicId`, `courseId`, `status` (not_started/in_progress/completed), `progress`, `completedAt` |
| `SimulationExercise` | `simulation_exercises` | `exercise_id` (UUID) | `topicId` (unique), `title`, `description`, `difficulty` |

**Personalization:**

| Model | Table | PK | Key Fields |
|---|---|---|---|
| `TopicPersonalization` | `topic_personalization` | `personalization_id` (UUID) | `topicId`, `userId`, `studyPersona` (normal/sports/cooking/adventure) — unique `(userId,topicId)` |
| `LearnerPersonaProfile` | `learner_persona_profiles` | `profile_id` (UUID) | `userId` + `courseId` (unique), `personaKey` (non_it_migrant/rote_memorizer/english_hesitant/last_minute_panic/pseudo_coder), `reasoning` |
| `TopicContentAsset` | `topic_content_assets` | `asset_id` (UUID) | `topicId`, `contentKey`, `contentType`, `personaKey` (nullable), `payload` (JSON), unique `(topicId, contentKey, personaKey)` |

**AI Tutor / RAG:**

| Model | Table | PK | Key Fields |
|---|---|---|---|
| `CourseChunk` | `course_chunks` | `chunk_id` (UUID) | `courseId`, `position`, `content`, `embedding` (vector 1536) |
| `RagChatSession` | `cp_rag_chat_sessions` | `session_id` (UUID) | `userId` + `courseId` + `topicId` (unique), `summary`, `lastMessageAt` |
| `RagChatMessage` | `cp_rag_chat_messages` | `message_id` (UUID) | `sessionId`, `userId`, `role` (user/assistant/system), `content`, `createdAt` |
| `TopicPromptSuggestion` | `topic_prompt_suggestions` | `suggestion_id` (UUID) | `topicId`, `courseId`, `promptText`, `answer`, `parentSuggestionId` (self-ref for follow-ups) |
| `ModulePromptUsage` | `module_prompt_usage` | `usage_id` (UUID) | `userId` + `courseId` + `moduleNo` (unique), `typedCount` (max 5), `lastTypedAt` |

**Cohort / Cold Calling:**

| Model | Table | PK | Key Fields |
|---|---|---|---|
| `Cohort` | `cohorts` | `cohort_id` (UUID) | `courseId`, `name` (unique), `isActive`, `startDate`, `endDate` |
| `CohortMember` | `cohort_members` | `member_id` (UUID) | `cohortId`, `userId` (nullable), `email`, `batchNo` — unique `(cohortId, email)` |
| `CohortBatchProject` | `cohort_batch_projects` | `project_id` (UUID) | `cohortId` + `batchNo` (unique), `title`, `tagline`, `description`, `notes` |
| `ColdCallPrompt` | `cold_call_prompts` | `prompt_id` (UUID) | `courseId`, `topicId`, `promptText`, `displayOrder` — unique `(topicId, displayOrder)` |
| `ColdCallMessage` | `cold_call_messages` | `message_id` (UUID) | `promptId`, `cohortId`, `userId`, `content`, `parentId`, `rootId`, `isStarred` |
| `ColdCallStar` | `cold_call_stars` | `star_id` (UUID) | `messageId` + `userId` (unique) |

**Commerce / Cart:**

| Model | Table | PK | Key Fields |
|---|---|---|---|
| `CartItem` | `cart_items` | `cart_item_id` (UUID) | `userId`, `courseSlug`, `courseTitle`, `price`, `discountedPrice` |
| `CartLine` | `cart_lines` | `line_id` (UUID) | `userId`, `courseId`, `quantity`, `unitPrice` |

**Auth / Sessions:**

| Model | Table | PK | Key Fields |
|---|---|---|---|
| `UserSession` | `user_sessions` | `session_id` (UUID) | `userId`, `jwtId`, `refreshTokenHash`, `expiresAt` |
| `Tutor` | `tutors` | `tutor_id` (UUID) | `userId` (unique), `bio`, `specialization`, `approved` |
| `CourseTutor` | `course_tutors` | `course_tutor_id` (UUID) | `tutorId` + `courseId` (unique) |
| `TutorApplication` | `tutor_applications` | `application_id` (UUID) | `fullName`, `email`, `linkedinUrl`, `resume` |

**Telemetry:**

| Model | Table | PK | Key Fields |
|---|---|---|---|
| `LearnerActivityEvent` | `learner_activity_events` | `event_id` (UUID) | `userId`, `courseId`, `eventType`, `eventData` (JSON), `createdAt` |

**CMS / Pages:**

| Model | Table | PK | Key Fields |
|---|---|---|---|
| `PageContent` | `page_content` | `page_id` (UUID) | `slug` (unique), `title`, `content` |

**Registration (NEW):**

| Model | Table | PK | Key Fields |
|---|---|---|---|
| `CourseOffering` | `course_offerings` | `offering_id` (UUID) | `courseId`, `programType` (cohort/ondemand/workshop), `title`, `price`, `startDate`, `capacity` — unique `(courseId, programType, title)` |
| `Registration` | `registrations` | `registration_id` (UUID) | `offeringId`, `fullName`, `email`, `phone`, `linkedinUrl`, `userId` (nullable), `assessmentAnswers` (JSON), `status`, `notes` — unique `(email, offeringId)` |
| `AssessmentQuestion` | `assessment_questions` | `question_id` (UUID) | `programType` (audience scope), `offeringId` (nullable), `questionText`, `questionType` (text/mcq), `options` (JSON), `order` |

**Enums defined in schema:**
- `StudyPersona`: normal, sports, cooking, adventure
- `LearnerPersonaProfileKey`: non_it_migrant, rote_memorizer, english_hesitant, last_minute_panic, pseudo_coder
- `RagChatRole`: user, assistant, system
- `ProgramType`: cohort, ondemand, workshop
- `AssessmentAudience`: all, cohort, ondemand, workshop
- `QuestionType`: text, mcq

### 8.2 External SQL tables (NOT in Prisma)

These tables are created manually via raw SQL (see `external-sql-ddl.md`). The quiz engine in `backend/src/routes/quiz.ts` accesses them via `prisma.$queryRaw`.

| Table | PK | Key Columns |
|---|---|---|
| `quiz_questions` | `question_id` (UUID) | `course_id`, `module_no`, `topic_pair_index`, `prompt`, `order_index` |
| `quiz_options` | `option_id` (UUID) | `question_id` (FK), `option_text`, `is_correct` |
| `quiz_attempts` | `attempt_id` (UUID) | `user_id`, `course_id`, `module_no`, `topic_pair_index`, `question_set` (JSONB), `answers` (JSONB), `score`, `status`, `completed_at` |
| `module_progress` | PK `(user_id, course_id, module_no)` | `videos_completed` (JSONB), `quiz_passed`, `unlocked_at`, `cooldown_until`, `completed_at`, `passed_at` |

---

## 9. Content Pipeline — Master/Derived JSON

### 9.1 Storage Model
- **Master content**: `topics.text_content` — stores either plain text or a JSON block layout
- **Content assets**: `topic_content_assets` — persona-specific payloads for block keys
- **Video**: `topics.video_url` — normalized to YouTube embed format by backend

### 9.2 JSON Block Layout Schema
```json
{
  "version": "1",
  "blocks": [
    {
      "id": "unique-block-id",
      "type": "text|image|video|ppt",
      "contentKey": "optional-asset-key",
      "tutorPersona": "optional-persona-filter",
      "data": { /* inline payload */ }
    }
  ]
}
```
Supported `type` values: `text`, `image`, `video`, `ppt`

### 9.3 Two Resolution Modes

**Mode 1 — contentKey (asset lookup)**:
1. Block has `contentKey` set, no inline `data`
2. Backend looks up `topic_content_assets` for `(topicId, contentKey)`
3. Persona match: tries `personaKey = learner's persona` first, falls back to `personaKey = null`
4. Asset `payload` becomes the block's `data`
5. If no asset found: block is **dropped** from output

**Mode 2 — inline (persona filtering)**:
1. Block has `data` inline (no `contentKey`)
2. If block has `tutorPersona` field: include only if it matches learner's persona OR learner has no persona
3. If block has no `tutorPersona`: always included

### 9.4 Block Payload Schemas

**Text block**: `{ "content": "HTML string" }`
**Image block**: `{ "url": "https://...", "alt": "description", "caption": "optional" }`
**Video block**: `{ "url": "https://youtube.com/embed/...", "title": "optional" }`
**PPT block**: `{ "url": "https://docs.google.com/...", "title": "optional" }`

### 9.5 Study Persona Variants
Separate from tutor persona. The backend returns `data.variants` on topic fetch:
```json
{
  "variants": {
    "normal": "standard text",
    "sports": "sports-themed text",
    "cooking": "cooking-themed text",
    "adventure": "adventure-themed text"
  }
}
```
Frontend toggles these client-side without additional API calls.

---

## 10. Persona Systems

### 10.1 Study Persona (topic-level narrator style)
| Property | Value |
|---|---|
| Storage | `topic_personalization` table |
| Key| `studyPersona` enum |
| Values | `normal`, `sports`, `cooking`, `adventure` |
| Resolution | Client-side toggle from `data.variants` |
| Scope | Per `(userId, topicId)` |
| API | `PUT /lessons/topics/:topicId/persona` |

### 10.2 Tutor Persona (LLM-classified learner profile)
| Property | Value |
|---|---|
| Storage | `learner_persona_profiles` table |
| Key | `personaKey` enum |
| Values | `non_it_migrant`, `rote_memorizer`, `english_hesitant`, `last_minute_panic`, `pseudo_coder` |
| Resolution | Backend content asset resolution + tutor prompt adaptation via `getPersonaPromptTemplate()` |
| Scope | Per `(userId, courseId)` |
| API | `POST /persona-profiles/analyze` (LLM classification), `GET /persona-profiles/:courseId` |
| Classification | LLM analyzes learner's responses to a survey, classifies into one of 5 profiles with reasoning |

### 10.3 Persona Prompt Templates
Each tutor persona has a custom prompt appended to RAG queries:
- `non_it_migrant` → Simplifies technical jargon, uses real-world analogies
- `rote_memorizer` → Encourages conceptual understanding over memorization
- `english_hesitant` → Uses simpler English, shorter sentences
- `last_minute_panic` → Provides structured, actionable summaries
- `pseudo_coder` → Bridges pseudo-code thinking to real implementation

---

## 11. Authentication & Sessions

### 11.1 OAuth Flow
1. Frontend redirects to `GET /auth/google?redirect=<postLoginURL>`
2. Backend generates state, sets it as httpOnly cookie, redirects to Google
3. Google callback → `GET /auth/google/callback?code=...&state=...`
4. Backend verifies state cookie, exchanges code for Google tokens
5. Upserts user (creates if new, updates picture/name if existing)
6. Creates session: generates `jwtId`, hashes refresh token via SHA-256, stores in `user_sessions`
7. Issues access token (900s TTL) + refresh token (30 days TTL)
8. Redirects to frontend callback URL with tokens as query params

### 11.2 JWT Payload
```json
{
  "userId": "uuid",
  "sessionId": "uuid",
  "jwtId": "uuid",
  "role": "learner|tutor|admin",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### 11.3 Token Refresh
- `POST /auth/refresh` with `{ refreshToken }` in body
- Backend hashes provided refresh token, matches against `user_sessions.refreshTokenHash`
- On match: rotates `jwtId`, issues new access + refresh tokens, updates session row
- On mismatch: returns 401

### 11.4 Frontend Session Management
- Tokens stored in localStorage (`session` key as JSON)
- `ensureSessionFresh()` — proactively refreshes access token when < 60s remaining (minimum 15s between attempts)
- `subscribeToSession()` — BroadcastChannel or storage event listener for cross-tab sync
- `resetSessionHeartbeat()` — called on page focus + visibility change
- `logoutAndRedirect()` — clears localStorage, redirects to `/`
- Auto-logout: triggered when stored session disappears and user previously had a session

### 11.5 Tutor/Admin Login (local)
- `POST /auth/tutor/login` with `{ email, password }`
- Backend verifies scrypt hash, returns JWT with `role: "tutor"`
- `POST /auth/admin/login` with `{ email, password }`
- Backend verifies scrypt hash, returns JWT with `role: "admin"`

---

## 12. Enrollment & Cohort Gating

### 12.1 Enrollment Flow
1. Frontend calls `POST /courses/:id/enroll` with `{ checkOnly?, protocolAccepted? }`
2. Backend resolves course ID
3. **Cohort gate**: Checks `cohort_members` for matching user email or userId in any active cohort for this course
4. If `checkOnly=true`: returns `{ eligible, cohortName, batchNo }` without writing
5. If enrolling: creates `enrollments` row, returns enrollment record
6. **Autopilot**: If user accepts protocol → auto-enrolls immediately

### 12.2 Cohort Access Resolution (`cohortAccess.ts`)
1. Query `cohort_members` joined with `cohorts` where `cohorts.isActive = true`
2. Match by `email` (case-insensitive) OR `userId`
3. If matched by email but `userId` is null → **backfill** `userId` on the member row
4. Returns `{ cohortId, cohortName, batchNo, memberId }`
5. No match → enrollment denied

### 12.3 Cold Call Membership Check
- Same `cohortAccess.ts` service is reused by cold call routes
- `checkCohortAccessForUser(userId, courseId)` returns cohort membership or null

---

## 13. Course Player & Content Rendering

### 13.1 Data Fetch
- `GET /lessons/courses/:courseKey/topics` — returns all topics for course (optionally with auth for personalization)
- Topics include `text_content` (resolved by backend), `video_url` (normalized), and progress if authenticated

### 13.2 Rendering Rules (CoursePlayerPage.tsx)
1. Parse `text_content` as JSON blocks if possible
2. Render blocks sequentially: text → image → video → PPT
3. "Study Material" header inserted before the first text block
4. If lesson starts with video: video-first layout, no study material header
5. First text block can attach an adjacent image block beside it
6. Read Mode toggle: collapses video section with smooth CSS transitions (height + opacity)
7. Auto-scroll to content area when Read Mode activated

### 13.3 Progress Tracking
- `PUT /lessons/topics/:topicId/progress` with `{ status, progress }`
- `status`: `not_started`, `in_progress`, `completed`
- `progress`: float 0-1 (clamped)
- `completedAt` auto-set when status becomes `completed`

### 13.4 Sidebar Navigation (CourseSidebar.tsx)
- Modules displayed as accordion sections
- Topics within modules shown with progress indicators
- Current topic highlighted
- Module lock indicators based on quiz/cooldown state

---

## 14. AI Tutor — RAG Pipeline

### 14.1 Entry Points
- `POST /assistant/query` — Main chat endpoint (requireAuth)
- `GET /assistant/session` — Load chat history for a session (requireAuth)

### 14.2 Query Processing Pipeline
1. **Auth check**: Extract `userId` from JWT
2. **Input validation**: `courseId` (required), `topicId` (required UUID), `question` (required string), optional `suggestionId`, `moduleNo`
3. **Course resolution**: UUID → direct, slug → lookup by `slug` or `legacyCourseAlias`, name → lookup by `courseName`
4. **Topic validation**: Verify topic exists and belongs to course
5. **Prompt type determination**: `suggestionId` present → suggested prompt; else → typed prompt
6. **Suggested prompt path**: Load pre-composed answer + follow-up suggestions from `topic_prompt_suggestions`
7. **Typed prompt path**: Check quota (5 typed/module), check rate limit (8 req/60s)
8. **Session management**: `ensureChatSession(userId, courseId, topicId)` — upserts session
9. **Context loading**: Get summary + last 10 turns + last assistant message
10. **Follow-up detection**: If question is ≤80 chars, starts with follow-up phrase ("what about", "can you explain", etc.), or contains pronouns ("it", "this", "that") → rewrite using LLM
11. **Persona loading**: Fetch `learner_persona_profiles` for `(userId, courseId)` → get persona prompt template
12. **RAG retrieval**: Embed question → cosine similarity search in `course_chunks` → top 5 contexts
13. **Prompt assembly**: System instructions + persona block + summary block + history block + course contexts + question
14. **LLM call**: `generateAnswerFromContext(prompt)` via OpenAI
15. **Response storage**: Save user message + assistant response to `cp_rag_chat_messages`
16. **Summary trigger**: If total messages ≥ 16 → generate summary via LLM, store in session
17. **Response**: `{ answer, nextSuggestions, sessionId }`

### 14.3 RAG Service Internals (`ragService.ts`)
- `askCourseAssistant()` — Orchestrates: PII scrub → embed → retrieve → build prompt → generate
- `fetchRelevantContexts()` — Raw SQL: `SELECT ... 1 - (embedding <=> vector) AS score ... ORDER BY ... LIMIT 5`
- `buildPrompt()` — Assembles: mentor persona + history usage + answer-from-contexts + persona + summary + history + contexts + question
- `replaceCourseChunks()` — Deletes existing chunks for course, batch-inserts new ones (50 per batch)
- `normalizeEmbedding()` — Validates 1536 dimensions, all finite numbers
- `toVectorLiteral()` — Formats as `'[0.1,0.2,...]'::vector` for raw SQL

### 14.4 PII Scrubbing (`pii.ts`)
- Regex strips email addresses and phone numbers from questions before embedding

### 14.5 Rate Limiting (`rateLimiter.ts`)
- In-memory Map keyed by userId
- Window: 60 seconds, max 8 requests
- Returns `true`/`false` for rate check

### 14.6 Prompt System Prompt
```
You are a warm, encouraging mentor assisting a learner in the course "{courseTitle}".
Use conversation history only to understand the learner's intent.
Answer using only the provided contexts from the official course material.
If the answer is not contained in the contexts, politely say you don't have that information.
Respond in 3-6 sentences total and keep the tone human and supportive.
```

---

## 15. Quiz Engine & Module Gating

### 15.1 Data Model (external SQL)
- `quiz_questions`: Questions per `(course_id, module_no, topic_pair_index)` — topic pairs = ceil(topics/2)
- `quiz_options`: Options per question, with `is_correct` flag
- `quiz_attempts`: Frozen question sets with answers, scores, and status
- `module_progress`: Per-user per-course per-module state (pass/fail, cooldown, unlock)

### 15.2 Question Selection (`loadQuestionSet`)
1. Query `quiz_questions` for `(courseId, moduleNo, topicPairIndex)` with randomized order
2. Limit to 5 questions (configurable, max 20)
3. Join `quiz_options` for each (also randomized)
4. Return `StoredQuestion[]` with options (including `isCorrect`)

### 15.3 Attempt Lifecycle
1. `POST /quiz/attempts` — Create attempt: loads questions, freezes in `question_set` JSONB, returns questions **without** `isCorrect`
2. `POST /quiz/attempts/:id/submit` — Submit answers: grade each question, compute score percentage
3. Pass threshold: **70%**
4. On pass: `upsertModuleProgress()` marks module pair as passed
5. If passed pair === `maxPair` for module → module marked as passed
6. If failed: 7-day cooldown applied to module

### 15.4 Module Gating Logic (`buildModuleStates`)
1. Module 1 is always unlocked
2. Module N requires Module N-1 to be `quiz_passed = true`
3. Cooldown: If `cooldown_until` is in the future, module is locked
4. Both conditions must be satisfied (quiz passed + cooldown elapsed) to unlock

### 15.5 Quiz Sections Endpoint (`buildQuizSections`)
- `GET /quiz/sections/:courseKey` — Returns flattened array of sections with:
  - `moduleNo`, `topicPairIndex`, `questionCount`
  - Per-section attempt status (best score, completed status)
  - Per-module lock state (cooldown lock, quiz lock)

### 15.6 `maxPair` Computation
```sql
SELECT MAX(topic_pair_index) FROM quiz_questions WHERE course_id = ? AND module_no = ?
```
Module passes only when the quiz at `maxPair` passes. If last pair has no questions, the module can never be marked passed.

### 15.7 Quiz Data Requirements
- Every module needs at least 1 question per `topic_pair_index`
- Highest `topic_pair_index` must exist or module can never pass
- Recommended: `ceil(N/2)` pairs for N lessons, at least 1 question per pair
- Missing data behavior: no sections shown for module, unlock gating becomes inconsistent

---

## 16. Cold Calling System

### 16.1 Purpose
Interactive prompts within cohort lessons where learners submit blind responses before seeing others' answers. Encourages independent thinking before peer exposure.

### 16.2 State Machine
```
NEW (prompt visible) → RESPONDED (learner submits blind response) → REVEALED (cohort responses visible)
```

### 16.3 Membership Gating
- Every cold call endpoint checks cohort membership via `checkCohortAccessForUser(userId, courseId)`
- Only members of an active cohort can view/respond to cold call prompts
- Non-members see no cold calling UI

### 16.4 Data Model
- `cold_call_prompts`: Per-topic prompts with `displayOrder` (unique per topic)
- `cold_call_messages`: User responses with `parentId` + `rootId` for threading
- `cold_call_stars`: Per-message stars (unique per user per message)

### 16.5 API Endpoints
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/cold-call/prompts?courseId=&topicId=` | requireAuth | List prompts for topic + user's responses |
| `POST` | `/cold-call/messages` | requireAuth | Submit blind response or reply |
| `GET` | `/cold-call/messages/:promptId` | requireAuth | Get all cohort responses for a prompt |
| `POST` | `/cold-call/messages/:messageId/star` | requireAuth | Toggle star on a message |

### 16.6 Threading Model
- **Root response**: `parentId = null`, `rootId = null` → direct response to prompt
- **Reply**: `parentId = <parent_msg_id>`, `rootId = <root_msg_id>` → threaded reply
- Frontend shows flat list of root responses with expandable reply threads

### 16.7 UI Behavior
- **Blind response**: Learner must submit their own response before seeing others
- **Self-protection**: Learner cannot see their own response's star count (prevents self-evaluation bias)
- **Starring**: Toggle action (star/unstar), updates optimistically in frontend

---

## 17. Telemetry & Tutor Monitor

### 17.1 Event Transport
- Frontend buffers events in memory (flush every 4s or at 20 events)
- `POST /activity/events` with `{ events: ActivityEvent[] }` (max 50 per request)
- requireAuth — anonymous events are not supported

### 17.2 Event Schema
```typescript
{
  eventType: string;
  courseId: string;
  eventData: Record<string, unknown>;
  clientTimestamp?: string;
}
```

### 17.3 Known Event Types
| Event Type | Data Fields | Emitted When |
|---|---|---|
| `persona_selected` | `{ persona, topicId }` | Study persona changed |
| `lesson_opened` | `{ topicId, topicName }` | Topic navigated to |
| `lesson_completed` | `{ topicId }` | Topic marked complete |
| `quiz_started` | `{ moduleNo, topicPairIndex }` | Quiz attempt created |
| `quiz_completed` | `{ moduleNo, topicPairIndex, score, passed }` | Quiz submitted |
| `tutor_query` | `{ topicId, isTyped }` | AI tutor question asked |
| `cold_call_response` | `{ promptId }` | Cold call response submitted |
| `enrollment` | `{ courseId }` | User enrolled |

### 17.4 Status Derivation (Backend `activityEventService.ts`)
Backend derives learner engagement status from recent events:
- **Engaged**: Active within last 3 days, multiple event types
- **Drift**: No activity for 3-7 days
- **Friction**: Activity exists but concentrated on quiz failures or repeated tutor queries

### 17.5 Tutor Monitor Endpoints
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/activity/courses/:courseId/learners` | requireAuth + requireTutor | Roster with status badges |
| `GET` | `/activity/learners/:learnerId/history` | requireAuth + requireTutor | Chronological event timeline |

---

## 18. Tutor Dashboard

### 18.1 Access Controls
- Role: `tutor` required (admin tokens fail `requireTutor` check)
- Course assignment: tutor must be in `course_tutors` for the selected course
- `GET /tutors/me/courses` returns only assigned courses

### 18.2 Core UI Features (TutorDashboardPage.tsx)
1. **Course selector** — dropdown from `/tutors/me/courses`
2. **Enrollment roster** — from `/tutors/courses/:courseId/enrollments`
3. **Progress table** — per-learner topic completion from `/tutors/courses/:courseId/progress`
4. **Telemetry monitor** — status badges (engaged/drift/friction) from `/activity/courses/:courseId/learners`, auto-refreshes every 30s
5. **Learner timeline** — event history from `/activity/learners/:learnerId/history`
6. **Tutor copilot chat** — AI-powered assistant for tutors from `/tutors/copilot/chat`

### 18.3 Copilot Chat
- Uses `tutorInsights.ts` → `buildTutorCourseSnapshot()` to generate course context
- Prompt includes enrollment stats, progress distributions, telemetry summaries
- LLM provides actionable insights for tutor's course management

### 18.4 Known Limitations
- Admin users cannot access `/tutors/*` routes (strict `requireTutor` check)
- Tutor dashboard assumes courses are already assigned in `course_tutors`
- No self-service course assignment for tutors

---

## 19. Landing Chatbot

### 19.1 Purpose
Sales-focused RAG chatbot embedded on the landing page (`LandingChatBot.tsx`) to help visitors understand course offerings and guide them toward enrollment.

### 19.2 Features
- **Personalized greetings**: Different messages for guests vs. authenticated users
- **RAG-powered**: Uses same `course_chunks` vector store for course knowledge
- **Smart redirects**: LLM can include `<<ACTION:URL>>` patterns in responses → frontend extracts and renders as clickable buttons
- **Session persistence**: Chat history stored in localStorage
- **Turn limits**: 5 turns for guests, 10 turns for authenticated users
- **Context**: Uses `landingKnowledge.ts` to build platform context (course catalog, pricing, methodology)

### 19.3 API
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/landing-assistant/chat` | Optional | Send message, get response |

---

## 20. Cohort Batch Projects

### 20.1 Purpose
Course projects assigned per batch within a cohort. Each batch gets a unique project brief.

### 20.2 Data Model
- `cohort_batch_projects`: `cohortId` + `batchNo` (unique), with `title`, `tagline`, `description`, `notes`
- Learner's `batchNo` comes from their `cohort_members` record

### 20.3 API
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/cohort-projects/:courseKey` | requireAuth | Returns project for user's batch in their active cohort |

### 20.4 Resolution Flow
1. Resolve course ID from `:courseKey`
2. Find user's cohort membership via `cohortAccess.ts`
3. Lookup `cohort_batch_projects` for `(cohortId, batchNo)`
4. Return project brief or 404

---

## 21. Registration System (New/Undocumented)

### 21.1 Overview
A multi-stage registration flow added after the original documentation was written. Supports three program types: cohort, on-demand, and workshops.

### 21.2 Data Model
- `CourseOffering`: Defines program offerings per course (type, price, dates, capacity)
- `Registration`: Captures applicant details + assessment answers
- `AssessmentQuestion`: Questions per program type or offering, with MCQ and text types

### 21.3 Frontend Flow (RegistrationPage.tsx)
URL-driven multi-stage flow:
1. `/registration` → Program type selection
2. `/registration/:programType` → Course selection
3. `/registration/:programType/:courseSlug` → Registration form
4. `/registration/:programType/:courseSlug/assessment` → Assessment questions
5. `/registration/:programType/:courseSlug/success` → Confirmation

### 21.4 Components
6 registration sub-components in `frontend/src/components/registration/`:
- Program type cards
- Course selection
- Registration form fields
- Assessment question renderer
- Success/confirmation view

### 21.5 Backend
- `registrationsRouter` at `/registrations` — handles CRUD for registrations
- Validates offering capacity and duplicate registrations

---

## 22. API Contracts — Full Reference

### 22.1 Health
| Method | Path | Auth | Body/Query | Response |
|---|---|---|---|---|
| `GET` | `/health` | None | — | `{ status: "ok", dbConnected: boolean }` |

### 22.2 Auth
| Method | Path | Auth | Body/Query | Response |
|---|---|---|---|---|
| `GET` | `/auth/google` | None | `?redirect=<url>` | 302 redirect to Google |
| `GET` | `/auth/google/callback` | None | `?code=&state=` | 302 redirect to frontend with tokens |
| `POST` | `/auth/refresh` | None | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| `POST` | `/auth/logout` | requireAuth | — | `{ message: "Logged out" }` |
| `POST` | `/auth/tutor/login` | None | `{ email, password }` | `{ accessToken, refreshToken, user }` |
| `POST` | `/auth/admin/login` | None | `{ email, password }` | `{ accessToken, refreshToken, user }` |

### 22.3 Users
| Method | Path | Auth | Response |
|---|---|---|---|
| `GET` | `/users/me` | requireAuth | `{ userId, email, fullName, picture, role }` |

### 22.4 Courses
| Method | Path | Auth | Body/Query | Response |
|---|---|---|---|---|
| `GET` | `/courses` | None | — | Array of course summaries |
| `GET` | `/courses/:id` | None | — | Course detail with topics count |
| `POST` | `/courses/:id/enroll` | requireAuth | `{ checkOnly?, protocolAccepted? }` | Enrollment or eligibility check |

### 22.5 Lessons
| Method | Path | Auth | Body/Query | Response |
|---|---|---|---|---|
| `GET` | `/lessons/courses/:courseKey/topics` | Optional | — | Topics with resolved content |
| `GET` | `/lessons/topics/:topicId/prompts` | Optional | `?topicId=&parentSuggestionId=` | Prompt suggestions |
| `PUT` | `/lessons/topics/:topicId/progress` | requireAuth | `{ status, progress }` | Updated progress |
| `PUT` | `/lessons/topics/:topicId/persona` | requireAuth | `{ studyPersona }` | Updated persona |
| `GET` | `/lessons/courses/:courseKey/progress` | requireAuth | — | All topic progress for course |

### 22.6 Assistant (AI Tutor)
| Method | Path | Auth | Body/Query | Response |
|---|---|---|---|---|
| `POST` | `/assistant/query` | requireAuth | `{ courseId, topicId, question, suggestionId?, moduleNo? }` | `{ answer, nextSuggestions, sessionId }` |
| `GET` | `/assistant/session` | requireAuth | `?courseId=&topicId=` | `{ messages, summary, sessionId }` |

### 22.7 Quiz
| Method | Path | Auth | Body/Query | Response |
|---|---|---|---|---|
| `GET` | `/quiz/sections/:courseKey` | requireAuth | — | Array of quiz sections with lock state |
| `POST` | `/quiz/attempts` | requireAuth | `{ courseId, moduleNo, topicPairIndex }` | `{ attemptId, questions (no answers) }` |
| `POST` | `/quiz/attempts/:id/submit` | requireAuth | `{ answers: { questionId, optionId }[] }` | `{ score, passed, results }` |
| `GET` | `/quiz/progress/:courseKey` | requireAuth | — | Module progress summary |
| `GET` | `/quiz/questions` | requireAuth | `?courseId=&moduleNo=&topicPairIndex=` | Raw questions (debug) |

### 22.8 Cold Calling
| Method | Path | Auth | Body/Query | Response |
|---|---|---|---|---|
| `GET` | `/cold-call/prompts` | requireAuth | `?courseId=&topicId=` | Prompts + user's responses |
| `POST` | `/cold-call/messages` | requireAuth | `{ promptId, content, parentId? }` | Created message |
| `GET` | `/cold-call/messages/:promptId` | requireAuth | — | All cohort messages for prompt |
| `POST` | `/cold-call/messages/:messageId/star` | requireAuth | — | Star toggle result |

### 22.9 Telemetry
| Method | Path | Auth | Body/Query | Response |
|---|---|---|---|---|
| `POST` | `/activity/events` | requireAuth | `{ events: ActivityEvent[] }` | `{ received: N }` |
| `GET` | `/activity/courses/:courseId/learners` | requireAuth + requireTutor | — | Learner roster with status |
| `GET` | `/activity/learners/:learnerId/history` | requireAuth + requireTutor | — | Event timeline |

### 22.10 Persona Profiles
| Method | Path | Auth | Body/Query | Response |
|---|---|---|---|---|
| `POST` | `/persona-profiles/analyze` | requireAuth | `{ courseId, answers }` | `{ personaKey, reasoning }` |
| `GET` | `/persona-profiles/:courseId` | requireAuth | — | User's persona profile |

### 22.11 Cohort Projects
| Method | Path | Auth | Response |
|---|---|---|---|
| `GET` | `/cohort-projects/:courseKey` | requireAuth | Project brief for user's batch |

### 22.12 Cart, Pages, Tutor Apps, Admin
- `GET/POST/DELETE /cart` — Cart CRUD
- `GET /pages/:slug` — CMS page content
- `POST /tutor-applications` — Submit tutor application
- `POST /admin/tutors/:id/approve` — Approve tutor application
- `POST /admin/courses` — Create course

### 22.13 Tutor Dashboard
| Method | Path | Auth | Response |
|---|---|---|---|
| `GET` | `/tutors/me/courses` | requireTutor | Assigned courses |
| `GET` | `/tutors/courses/:courseId/enrollments` | requireTutor | Enrollment roster |
| `GET` | `/tutors/courses/:courseId/progress` | requireTutor | Per-learner progress |
| `POST` | `/tutors/copilot/chat` | requireTutor | Copilot AI response |

### 22.14 Error Shape
All errors return: `{ message: string }` with appropriate HTTP status codes.

---

## 23. Middleware Map

### 23.1 Global Middleware Chain
```
Request → CORS → cookieParser → express.json → express.urlencoded → Router
```

### 23.2 Per-Router Middleware

| Router Group | Middleware Chain |
|---|---|
| Health, Pages | None |
| Auth (Google endpoints) | None (public) |
| Auth (refresh) | None |
| Auth (logout) | `requireAuth` |
| Users | `requireAuth` |
| Courses (list, detail) | None |
| Courses (enroll) | `requireAuth` |
| Lessons (topics) | Optional auth (tries to extract user, doesn't fail) |
| Lessons (progress, persona) | `requireAuth` |
| Assistant | `requireAuth` |
| Landing Assistant | None (public) |
| Quiz | `requireAuth` |
| Cold Call | `requireAuth` + cohort membership check |
| Activity (events) | `requireAuth` |
| Activity (monitor) | `requireAuth` + `requireTutor` |
| Tutors | `requireAuth` + `requireTutor` |
| Admin | `requireAuth` + `requireAdmin` |
| Persona Profiles | `requireAuth` |
| Cohort Projects | `requireAuth` |
| Cart | `requireAuth` |
| Tutor Applications | None (public) |
| Registrations | Mixed (some public, some auth) |
| Dashboard | `requireAuth` |

---

## 24. End-to-End Flow Traces

### 24.1 Login Flow
1. User clicks "Sign In" → Navbar `onLogin` → redirect to `GET /auth/google?redirect=/`
2. Backend sets state cookie → redirect to Google consent
3. User authorizes → Google calls `GET /auth/google/callback?code=&state=`
4. Backend: verify state, exchange code, upsert user, create session, issue tokens
5. Redirect to `/auth/callback?accessToken=...&refreshToken=...&user=...`
6. `AuthCallbackPage.tsx` stores tokens in localStorage, redirects to `postLoginRedirect`

### 24.2 Enrollment Flow
1. User visits `/course/:id` → `CourseDetailsPage` loads course details
2. User clicks "Enroll" → `EnrollmentGateway` → `POST /courses/:id/enroll { checkOnly: true }`
3. Backend checks cohort membership → returns eligibility
4. If eligible + protocol accepted → `POST /courses/:id/enroll { protocolAccepted: true }`
5. Backend creates enrollment → response includes enrollment data
6. Frontend redirects to `/course/:id/learn/1`

### 24.3 Lesson Playback
1. `CoursePlayerPage` mounts → `GET /lessons/courses/:courseKey/topics`
2. Backend resolves course, fetches topics + content assets + persona profile
3. `resolveContentLayout()` processes JSON blocks with persona resolution
4. Frontend renders: sidebar (CourseSidebar) + video (VideoPlayer) + blocks + cold calling + quiz
5. User interaction → `PUT /lessons/topics/:topicId/progress { status, progress }`
6. Telemetry events buffered and flushed

### 24.4 Tutor Chat
1. User opens ChatBot dock → `GET /assistant/session?courseId=&topicId=`
2. Session loaded with history + prompt suggestions
3. User types or clicks suggestion → `POST /assistant/query { courseId, topicId, question }`
4. Backend: validate → check quotas → load context → rewrite followup → RAG retrieve → build prompt → LLM → store messages → respond
5. Frontend renders answer + next suggestions

### 24.5 Quiz Attempt
1. User clicks quiz section → `POST /quiz/attempts { courseId, moduleNo, topicPairIndex }`
2. Backend loads random questions, freezes in attempt, returns without answers
3. Frontend starts 150s timer, renders questions
4. User submits → `POST /quiz/attempts/:id/submit { answers }`
5. Backend grades (70% threshold), updates module progress if passed
6. Frontend shows results, updates sidebar lock state

### 24.6 Cold Calling
1. `ColdCalling.tsx` mounts per topic → `GET /cold-call/prompts?courseId=&topicId=`
2. If no prior response: show prompt + blind input
3. User submits → `POST /cold-call/messages { promptId, content }`
4. After submission → `GET /cold-call/messages/:promptId` (cohort responses revealed)
5. User can reply → `POST /cold-call/messages { promptId, content, parentId }`
6. User can star → `POST /cold-call/messages/:messageId/star`

### 24.7 Persona Selection
1. User triggers persona analysis → `PersonaProfileModal` opens
2. User answers survey questions
3. Submit → `POST /persona-profiles/analyze { courseId, answers }`
4. Backend calls OpenAI to classify → stores in `learner_persona_profiles`
5. Future content resolution uses this persona for asset lookup

### 24.8 Logout Flow
1. User clicks "Logout" → `POST /auth/logout` (if called) → clears session
2. Frontend: clears localStorage (`session`, `user`, `isAuthenticated`)
3. Redirects to `/`
4. Cross-tab: `subscribeToSession` detects missing session → auto-logout in other tabs

---

## 25. Canonical Identifiers & Course Resolution

### 25.1 The Problem
Multiple course identifiers exist across the system. Using the wrong one causes silent failures, especially in RAG retrieval where `course_chunks.course_id` must match exactly.

### 25.2 Identifier Types
| Identifier | Example | Where Used |
|---|---|---|
| Course UUID | `f26180b2-5dda-495a-a014-ae02e63f172f` | DB primary key, most backend lookups |
| Course slug | `ai-in-web-development` | URL routing, seed, **RAG `course_chunks.course_id`** |
| Course name | `AI in Web Development` | Display, some legacy lookups |
| Legacy alias | `ai-in-web-development` | `courses.legacyCourseAlias`, fallback resolution |
| Marketing slug | `ai-native-fullstack-developer` | Frontend display only |

### 25.3 Resolution Logic (`resolveCourseId()` in lessons.ts, assistant.ts, quiz.ts)
```
Input → Is UUID? → Direct DB lookup
      → Not UUID? → Try slug lookup → Try legacyCourseAlias → Try courseName
```
Each router has its own `resolveCourseId()` function (duplicated across lessons, assistant, quiz).

### 25.4 Critical RAG Compatibility
- `course_chunks.course_id` is populated during ingestion with the **string** passed as argument (e.g., `ai-in-web-development`)
- RAG queries match on this string exactly
- If runtime code sends a UUID but chunks were ingested with the slug → **zero RAG contexts returned**
- **Recommendation**: Always use `ai-in-web-development` as the course identifier passed to RAG queries

### 25.5 Compatibility Matrix
| Router | Accepts UUID | Accepts Slug | Accepts Name |
|---|---|---|---|
| Lessons | ✅ | ✅ (slug + alias) | ✅ |
| Assistant | ✅ | ✅ (slug + alias) | ✅ |
| Quiz | ✅ | ✅ (slug + alias) | ✅ |
| Courses | ✅ | ✅ | ❌ |

---

## 26. Seed & Ingestion Pipeline

### 26.1 Database Seed (`backend/prisma/seed.ts`)
**Hard-coded IDs:**
- Course UUID: `f26180b2-5dda-495a-a014-ae02e63f172f`
- Course slug: `ai-in-web-development`

**Seeded Records:**
1. **Admin user**: `jaswanthvanapalli12@gmail.com`, password `Ottobon@2025` (scrypt hashed), role `admin`
2. **Courses**: Primary course "AI in Web Development" + additional catalog courses (React, Python, etc.)
3. **Topics**: From CSV file `topics_all_modules.csv` (repo root), filtered by `course_id === COURSE_ID`, existing topics deleted before seeding
4. **Simulation exercises**: One per topic, auto-generated from topic names
5. **Page content**: `about`, `courses`, `become-a-tutor` pages

### 26.2 RAG Ingestion
**Default ingestion command:**
```bash
cd backend
npm run rag:ingest "../Web Dev using AI Course Content.pdf" ai-in-web-development "AI Native Full Stack Developer"
```
- PDF → text extraction → chunking (900 chars, 150 overlap) → embedding (`text-embedding-3-small`) → `course_chunks` (pgvector)
- Existing chunks for the course are **deleted** before insertion
- Batch size: 50 chunks per INSERT

**Import precomputed embeddings:**
```bash
cd backend
npm run rag:import <json-file>
```
- Default JSON: `../neo4j_query_table_data_2025-12-24.json`
- Validates each row has `chunkId`, `courseId`, `content`, `embedding`
- Uses `ON CONFLICT ... DO UPDATE` for upsert

### 26.3 Manual Seeding Requirements
| Data | Method | Notes |
|---|---|---|
| Cohorts + members | Manual SQL/Prisma | `cohort_members` need email or userId |
| Cold call prompts | Manual SQL/Prisma | Per-topic `cold_call_prompts` |
| Content assets | Manual SQL/Prisma | `topic_content_assets` for contentKey blocks |
| Quiz questions + options | Manual SQL | External tables, not in Prisma |
| Module progress init | Auto-created | First quiz attempt creates unlock row |

---

## 27. Runtime Constants

| Constant | Value | Location |
|---|---|---|
| RAG top-K contexts | 5 | `ragService.ts` `VECTOR_QUERY_LIMIT` |
| Embedding dimensions | 1536 | `ragService.ts` `EMBEDDING_DIMENSIONS` |
| Chunk insert batch | 50 | `ragService.ts` `INSERT_BATCH_SIZE` |
| Chunk size | 900 chars | `textChunker.ts` |
| Chunk overlap | 150 chars | `textChunker.ts` |
| Rate limit window | 60 seconds | `rateLimiter.ts` |
| Rate limit max | 8 requests | `rateLimiter.ts` |
| Typed prompt quota | 5 per module | `promptUsageService.ts` |
| Chat history per request | 10 turns | `assistant.ts` `CHAT_HISTORY_LIMIT` |
| Session load limit | 40 messages | `assistant.ts` `CHAT_HISTORY_LOAD_LIMIT` |
| Summary threshold | 16 messages | `assistant.ts` `SUMMARY_MIN_MESSAGES` |
| Follow-up max length | 80 chars | `assistant.ts` `shouldRewriteFollowUp()` |
| Quiz pass threshold | 70% | `quiz.ts` |
| Quiz default limit | 5 questions | `quiz.ts` |
| Quiz max limit | 20 questions | `quiz.ts` Zod schema |
| Module cooldown | 7 days | `quiz.ts` `parseDurationToMs()` default |
| Quiz timer (frontend) | 150 seconds | `CoursePlayerPage.tsx` |
| Access token TTL | 900 seconds | env default |
| Refresh token TTL | 30 days | env default |
| Session refresh buffer | 60 seconds | `utils/session.ts` |
| Session min delay | 15 seconds | `utils/session.ts` |
| Telemetry flush interval | 4 seconds | `utils/telemetry.ts` |
| Telemetry buffer max | 20 events | `utils/telemetry.ts` |
| Telemetry max per request | 50 events | `activity.ts` |
| Landing chatbot guest limit | 5 turns | `LandingChatBot.tsx` |
| Landing chatbot user limit | 10 turns | `LandingChatBot.tsx` |
| Tutor monitor refresh | 30 seconds | `TutorDashboardPage.tsx` |
| Anonymous user UUID | `00000000-0000-0000-0000-000000000000` | `quiz.ts` |
| Default LLM model | `gpt-3.5-turbo` | env default |
| Default embedding model | `text-embedding-3-small` | env default |

---

## 28. Database Invariants & Constraints

### 28.1 ID Generation
All UUIDs use `gen_random_uuid()` (database-generated).

### 28.2 Cascade Delete Rules
| Parent | Child | On Delete |
|---|---|---|
| `users` | `enrollments` | Cascade |
| `users` | `topic_progress` | Cascade |
| `users` | `topic_personalization` | Cascade |
| `users` | `user_sessions` | Cascade |
| `users` | `learner_persona_profiles` | Cascade |
| `users` | `learner_activity_events` | Cascade |
| `users` | `cold_call_messages` | Cascade |
| `users` | `cold_call_stars` | Cascade |
| `users` | `cp_rag_chat_sessions` | Cascade |
| `users` | `cp_rag_chat_messages` | Cascade |
| `users` | `module_prompt_usage` | Cascade |
| `users` | `registrations` | SetNull |
| `courses` | `topics` | Cascade |
| `courses` | `enrollments` | Cascade |
| `courses` | `cohorts` | Cascade |
| `courses` | `course_chunks` | Cascade |
| `courses` | `cart_lines` | Restrict |
| `topics` | `topic_progress` | Cascade |
| `topics` | `simulation_exercises` | Cascade |
| `topics` | `topic_content_assets` | Cascade |
| `topics` | `cold_call_prompts` | Cascade |
| `cohorts` | `cohort_members` | Cascade |
| `cohorts` | `cohort_batch_projects` | Cascade |
| `cold_call_prompts` | `cold_call_messages` | Cascade |
| `cold_call_messages` | `cold_call_stars` | Cascade |
| `cp_rag_chat_sessions` | `cp_rag_chat_messages` | Cascade |
| `course_offerings` | `registrations` | Cascade |
| `course_offerings` | `assessment_questions` | Cascade |

### 28.3 Key Unique Constraints
| Table | Unique Constraint |
|---|---|
| `users` | `email` |
| `courses` | `slug` |
| `enrollments` | `(userId, courseId)` |
| `topic_personalization` | `(userId, topicId)` |
| `learner_persona_profiles` | `(userId, courseId)` |
| `topic_content_assets` | `(topicId, contentKey, personaKey)` |
| `cohorts` | `name` |
| `cohort_members` | `(cohortId, email)` |
| `cohort_batch_projects` | `(cohortId, batchNo)` |
| `cold_call_prompts` | `(topicId, displayOrder)` |
| `cold_call_stars` | `(messageId, userId)` |
| `cp_rag_chat_sessions` | `(userId, courseId, topicId)` |
| `module_prompt_usage` | `(userId, courseId, moduleNo)` |
| `tutors` | `userId` |
| `course_tutors` | `(tutorId, courseId)` |
| `course_offerings` | `(courseId, programType, title)` |
| `registrations` | `(email, offeringId)` |

---

## 29. Legacy & Unwired Inventory

### 29.1 Frontend Pages NOT Routed
These files exist in `frontend/src/pages/` but are **not** referenced in `App.tsx`:
- `AuthPage.tsx` (13.1KB)
- `TutorLoginPage.tsx` (4.2KB)
- `CoursesPage.tsx` (18.7KB)
- `DashboardPage.tsx` (40.3KB)
- `CartPage.tsx` (22.4KB)
- `AboutPage.tsx` (10.0KB)
- `LearningPathPage.tsx` (14.5KB)

**Legacy-but-routed pages** (functional but considered legacy flow):
- `EnrollmentPage.tsx` — the older enrollment flow
- `AssessmentPage.tsx` — the older assessment flow

### 29.2 Backend Routes NOT Mounted
All route files in `backend/src/routes/` **are** mounted except:
- `lessons.ts.bak` — backup file, not imported

### 29.3 Env Variables That Can Drift
- `VITE_API_URL` (used only in Navbar OAuth redirect)
- `VITE_API_BASE_URL` (used by API helper)
- These must stay aligned to avoid inconsistent routing

### 29.4 Data Paths Not Enforced by Prisma
Quiz tables (`quiz_questions`, `quiz_options`, `quiz_attempts`, `module_progress`) exist outside Prisma schema and must be created manually via SQL.

---

## 30. Design Guidelines

### 30.1 Visual Principles
- **Primary colors**: Deep navy + accent gold
- **Typography**: Inter/Roboto font stack
- **Spacing**: 8px grid system
- **Border radius**: 8px default, 12px for cards

### 30.2 Course Player Layout Rules
- Max content width: 720px
- Video aspect ratio: 16:9
- Sidebar width: 320px (collapsible)
- Mobile: sidebar becomes bottom sheet

### 30.3 Component Styles
- Buttons: primary (filled), secondary (outline), ghost
- Cards: slight shadow, hover elevation
- Modals: centered overlay with backdrop blur
- Toast: bottom-right positioning

### 30.4 Motion & Accessibility
- Transitions: 200ms ease
- Reduced motion: respects `prefers-reduced-motion`
- Color contrast: WCAG AA minimum
- Focus indicators: visible ring on keyboard navigation

---

## 31. Deployment & Operations

### 31.1 Development
```bash
# Backend
cd backend && npm install && npx prisma generate && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

### 31.2 Database Setup
```bash
cd backend
npx prisma migrate deploy     # Run migrations
npx prisma db seed            # Seed data
# Manually run external-sql-ddl.md for quiz tables
# Run rag:ingest for RAG chunks
```

### 31.3 Docker Frontend
See `frontend/DOCKER_DEPLOYMENT.md` — Nginx-based multi-stage build.

### 31.4 Storage Expectations
- PDF ingestion reads files locally; no external object storage
- Content assets (`topic_content_assets.payload`) store URLs as strings; media hosted externally
- No file upload endpoints exist

### 31.5 Observability
- RAG usage logs printed as JSON to stdout
- Unhandled errors return generic `{ message: "Internal server error" }`
- No structured logging framework
- No APM/tracing integration

---

## 32. Known Issues & Risks

### 32.1 Architectural Issues
1. **Course ID mismatch in RAG**: If `course_chunks.course_id` was ingested with slug but runtime sends UUID → zero contexts. Mitigation: consistently use `ai-in-web-development`.
2. **Admin ≠ Tutor**: Admin tokens fail `requireTutor` checks. Admins cannot access tutor dashboard without a separate tutor login.
3. **Duplicated `resolveCourseId()`**: Same function implemented independently in `lessons.ts`, `assistant.ts`, and `quiz.ts`. Changes must be synced manually.
4. **In-memory rate limiter**: Resets on server restart. Not suitable for multi-instance deployments.
5. **Quiz tables outside Prisma**: `quiz_questions`, `quiz_options`, `quiz_attempts`, `module_progress` must be provisioned manually. No migration safety net.

### 32.2 Data Consistency Risks
1. **Missing quiz data** → modules can never be marked passed → subsequent modules permanently locked
2. **`maxPair` depends on quiz_questions data**: If highest `topic_pair_index` is missing, module pass is impossible
3. **Cohort member userId backfill**: If a user signs up with a different email than what's in `cohort_members`, they won't be linked
4. **Topic ordering**: `topics.order` field exists but modules use `module_no` + `topic_number` for sorting — mismatches can cause wrong lesson flow

### 32.3 Frontend Issues
1. **File naming inconsistency**: `Strudent_Dashboard.tsx` (typo in filename)
2. **Large monolithic pages**: `CoursePlayerPage.tsx` at 96KB is extremely large and hard to maintain
3. **Multiple unwired pages**: ~110KB+ of unused page code in the repository
4. **Two env variables for same purpose**: `VITE_API_URL` and `VITE_API_BASE_URL` can drift

### 32.4 Security Considerations
1. **Tokens in query params**: OAuth callback passes tokens as URL query parameters (logged in browser history)
2. **Tokens in localStorage**: Vulnerable to XSS (industry-standard tradeoff for SPAs)
3. **No CSRF protection**: Relies on CORS + Authorization header (acceptable for pure API)
4. **Admin password in seed**: `Ottobon@2025` is hard-coded in seed file

### 32.5 Scalability Limitations
1. **No caching layer**: Every request hits the database
2. **In-memory rate limiter**: Single-process only
3. **Synchronous embedding calls**: RAG queries block on OpenAI API
4. **No pagination on most list endpoints**: Could be problematic with scale

---

*End of Document — 32 sections, complete mental model of the Course Platform codebase.*

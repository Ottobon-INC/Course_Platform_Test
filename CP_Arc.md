# Course Platform Architecture Overview

This document summarizes how the Course Platform Test application is put together across the UI, backend services, and data stores so backend developers can reason about every layer end to end.

## 1. High-Level Runtime Topology

| Layer | Technology | Endpoints/Ports | Purpose |
| --- | --- | --- | --- |
| Presentation (Client) | React 18 + Vite + Wouter + TanStack Query | http://localhost:5173 | Learner dashboard, course player, enrollment, cart, chatbot UI |
| Application/API | Node 20 + Express + TypeScript | http://localhost:4000 (`/` + `/api` mirror) | Auth, course data, lessons/progress, cart, static pages, RAG assistant |
| Data | PostgreSQL (managed through Supabase or local Docker) + Prisma ORM | `DATABASE_URL` | Courses, topics, enrollments, carts, tutor apps, CMS pages |
| Knowledge Store | Neo4j Aura (vector index) | `neo4j+s://...` | Stores embedded course chunks for retrieval-augmented answers |
| ML Provider | OpenAI APIs | HTTPS | Embeddings + LLM completions for the mentor |

```
Browser ──(HTTPS fetch via Vite dev proxy)──► Frontend (5173)
  │                             │
  │ REST/JSON over fetch        │ CORS-allowed origins
  ▼                             ▼
Express API (4000) ── Prisma ──► PostgreSQL (Supabase)
         │            │
         │            └─ topic/course/cart data
         │
         ├─> Neo4j (vector index) ──> stored embeddings
         └─> OpenAI (embeddings + chat)
```

## 2. Client Layer (UI)

- **Framework stack:** Vite + React 18, Wouter for routing, TanStack Query for data fetching/caching, shadcn/ui for components, Lucide icons, Tailwind utility classes.
- **Entry point:** `frontend/src/App.tsx` wires `QueryClientProvider`, tooltip/toast providers, and routes.
- **Key pages:**
  - `/dashboard`, `/courses`, `/cart`, `/course/:id/learn/:lesson`, `/course/:id/enroll`, `/course/:id/assessment`, `/become-a-tutor`, `/about`, `/auth/callback`.
- **State & session:**
  - Auth tokens from Google OAuth callback are persisted in `localStorage` (helpers in `utils/session.ts`).
  - Derived session state is consumed by components like `ChatBot` and `CoursePlayerPage` to decide whether to call protected APIs.
- **Data fetching pattern:**
  - `lib/queryClient.ts` builds a shared `QueryClient` with a fetch-based `queryFn`. All routes use the `/api/...` prefix so the same Express handlers can be mounted directly or through `/api`.
  - Queries example: `/api/lessons/courses/:courseId/topics`, `/api/lessons/:lessonId/progress`, `/api/courses/:courseId`, `/api/cart`, `/assistant/query`.
- **UI modules involved in learning experience:**
  - `CoursePlayerPage.tsx` orchestrates topic fetching, grouping them by module, deriving lesson metadata, handling progress, and integrating `CourseSidebar`, `LessonTabs`, and `ChatBot`.
  - `CourseSidebar.tsx` renders module/lesson hierarchy with progress display and search.
  - `ChatBot.tsx` manages AI assistant interactions, enforcing auth and course context.

## 3. Application Layer (Express API)

- **Server bootstrap:** `backend/src/app.ts` sets up Express, JSON parsing, cookie parsing, strict CORS based on `FRONTEND_APP_URLS`, and mounts routers twice (base path and `/api`).
- **Authentication:**
  - Google OAuth entry (`GET /auth/google`) and callback (`/auth/google/callback`) exchange codes via `services/googleOAuth`, then create sessions with signed JWT access/refresh tokens.
  - `sessionService.ts` stores hashed refresh tokens + metadata in `user_sessions` (Prisma) and exposes `createSession`, `renewSessionTokens`, `deleteSessionByRefreshToken`, and `verifyAccessToken` (enforced by `middleware/requireAuth`).
  - `/auth/google/exchange`, `/auth/google/id-token`, `/auth/refresh`, `/auth/logout` provide REST alternatives.
- **Core routers:**

| Router | Key endpoints | Notes |
| --- | --- | --- |
| `healthRouter` | `GET /health` | Liveness check. |
| `usersRouter` | (not detailed above) | Handles profile/session utilities when extended. |
| `coursesRouter` | `GET /courses`, `GET /courses/:courseKey` | Resolves by UUID, slug, or human-friendly name; maps responses for frontend. |
| `lessonsRouter` | `GET /lessons/courses/:courseKey/topics`, `GET/PUT /lessons/:lessonId/progress`, legacy `GET /lessons/modules/:moduleNo/topics` | Course topics served in module order; progress currently stored in-memory per user (placeholder until DB persistence). |
| `cartRouter` | Auth-required `GET/POST/DELETE` endpoints | Backed by `cart_items` table via `services/cartService.ts`. Ensures course metadata persisted with each entry. |
| `tutorApplicationsRouter` | Collects tutor apply forms | Persists to `tutor_applications`. |
| `pagesRouter` | `GET /pages/:slug` | Headless CMS blocks for About, etc. |
| `assistantRouter` | `POST /assistant/query` (auth required + rate-limited) | Taps RAG service using sanitized questions. |

- **Utility patterns:** `asyncHandler` wraps async routes, zod schemas validate payloads, environment configuration is validated via zod at startup.

## 4. Data & Integration Layer

### 4.1 PostgreSQL (Supabase-managed)
- Accessed via Prisma (`services/prisma.ts`) with schema defined in `backend/prisma/schema.prisma`.
- Important tables & relationships:
  - `users`, `user_sessions` (auth), `courses`, `topics`, `topic_progress`, `cart_items`, `cart_lines`, `enrollments`, `tutor_applications`, `page_content`.
  - Foreign keys enforce cascade deletes for user-owned records; `topics` relate back to `courses` for module queries.
- Deployment options: local Docker compose under `infrastructure/docker-compose.yml` or Supabase-hosted Postgres via `DATABASE_URL`.

### 4.2 Neo4j Vector Index
- Configured in `rag/neo4jClient.ts` with `COURSE_CHUNK_LABEL = "CourseChunk"` and vector index `course_chunk_embedding_idx` using cosine similarity on 1,536-dim embeddings.
- `ensureVectorIndex()` runs automatically before chunk imports.
- Stored nodes: `(Course)-[:HAS_CHUNK]->(CourseChunk)` with properties `chunkId`, `content`, `courseId`, `position`, `embedding`, timestamps.

### 4.3 OpenAI Integrations
- `rag/openAiClient.ts` wraps embeddings + chat completions using keys/models from env.
- `createEmbedding` returns float vectors; `generateAnswerFromContext` prompts the chat model to respond with strictly course-based answers.

### 4.4 Other Stores
- Lesson progress currently cached in-memory map `progressStore` (scoped to API instance). Persistence to `topic_progress` can be added later.
- Local filesystem for PDF ingestion (`npm run rag:ingest`).

## 5. End-to-End Data Flows

### 5.1 User sign-in & session propagation
1. User clicks "Sign in" → frontend sends browser to `/auth/google` on the backend (port 4000) with a redirect hint.
2. Backend sets a short-lived state cookie and redirects to Google OAuth consent.
3. Google redirects to `/auth/google/callback`; backend exchanges the code, creates/fetches a user record, issues JWT access + refresh tokens, stores hashed refresh token in Postgres.
4. Backend redirects to `http://localhost:5173/auth/callback` (from `FRONTEND_APP_URLS`) with tokens in query params; frontend stores them (via `utils/session.ts`).
5. Subsequent API calls attach `Authorization: Bearer <accessToken>` or rely on `credentials: "include"` cookies if configured.

### 5.2 Course playback & progress
1. Learner visits `/course/:courseId/learn/:lesson` in the frontend.
2. `CoursePlayerPage.tsx` resolves `courseId`, ensures the user is authenticated, and fetches `/api/lessons/courses/:courseId/topics` along with `/api/courses/:courseId` and `/api/lessons/:lessonId/progress`.
3. Topics are grouped per module and transformed into lesson entries powering `CourseSidebar` and `LessonTabs`.
4. When a learner watches/reads, progress updates trigger `PUT /api/lessons/:lessonId/progress`; the optimistic state updates the sidebar.
5. If the user navigates without specifying a lesson, the client redirects to the first available lesson (intro → fetched modules → static fallback).

### 5.3 Cart & checkout prep
1. On course tiles, “Add to cart” invokes `POST /api/cart` with the course payload; `requireAuth` ensures only signed-in users can add items.
2. `cartService` upserts metadata into `cart_items`, guaranteeing uniqueness per (user, courseSlug).
3. Frontend renders `/cart` by calling `GET /api/cart`. Removing or clearing items calls the corresponding DELETE endpoints.

### 5.4 Tutor application intake
- `/become-a-tutor` form submits to `/api/tutor-applications` (validation via zod), persisting the structured application for internal review.

### 5.5 Retrieval-Augmented Q&A
1. Content ingestion (`npm run rag:ingest`) reads a PDF, runs `textChunker` (default chunk 900 chars, overlap 150), builds embeddings via OpenAI, and writes `(Course)-[:HAS_CHUNK]->(CourseChunk)` nodes to Neo4j after wiping old chunks per course.
2. Learner opens the chatbot panel; `ChatBot.tsx` checks `readStoredSession()` for tokens.
3. When a question is sent, the component POSTs `/assistant/query` with `{ courseId, courseTitle?, question }` and `Authorization` header.
4. `assistantRouter` enforces auth + `assertWithinRagRateLimit`, scrubs PII (`rag/pii.ts`), then:
   - Calls `createEmbedding(question)`.
   - Runs `CALL db.index.vector.queryNodes()` via `fetchRelevantContexts` to retrieve the top 5 chunk matches filtered by course.
   - Builds a prompt + context list and obtains a completion from OpenAI.
   - Logs success/failure via `logRagUsage` and returns `{ answer }` to the frontend.
5. Frontend appends the bot response to the chat; errors surface as friendly messages (401 → session expired, 429 → slow down, others → generic failure).

## 6. Environments & Configuration

- `.env.example` documents all required secrets/config:
  - Port bindings, `DATABASE_URL`, comma-delimited `FRONTEND_APP_URLS`.
  - Google OAuth credentials + redirect URI.
  - JWT secrets & TTLs.
  - OpenAI + Neo4j credentials.
- Local dev typically runs:
  - `npm install && npm run dev` in `frontend/` (Vite dev server on 5173).
  - `npm install && npm run dev` in `backend/` (ts-node/tsx on 4000).
  - Optional Docker compose for Postgres + pgAdmin under `infrastructure/` or Supabase-managed Postgres referenced via `DATABASE_URL`.
- Production deployment would front the API with HTTPS + managed secrets, but the code already enforces strict origins, bearer tokens, and rate limits for the assistant.

## 7. Layered Responsibility Matrix

| Layer | Responsibilities | Key Artifacts |
| --- | --- | --- |
| Presentation/UI | Routing, component rendering, optimistic UX, accessible interactions | `frontend/src/pages`, `components/` (CourseSidebar, LessonTabs, ChatBot), `hooks/`, shadcn UI atoms |
| Application/API | Auth, validation, orchestration, cart/topic logic, tutor submissions, assistant interface | `backend/src/routes`, `middleware/requireAuth.ts`, `services/*`, `rag/*` |
| Domain/Data | Persistence schema, migrations, transactional logic | `backend/prisma/schema.prisma`, `services/prisma.ts`, `services/cartService.ts`, `rag/neo4jClient.ts` |
| Intelligence | Vectorization, retrieval, LLM responses | `rag/openAiClient.ts`, `rag/ragService.ts`, Neo4j index |

## 8. Considerations & Next Steps

- **Lesson progress persistence:** replace the temporary `Map` with `topic_progress` inserts so progress survives restarts and syncs between devices.
- **API coverage documentation:** expand this doc with OpenAPI/Swagger specs for all routers to improve contract visibility.
- **Observability:** instrument structured logs/metrics around key flows (cart, lessons, RAG) for production readiness.
- **Deployment hardening:** add HTTPS termination, secret management, CI/CD, and automated migrations before going live.

---
This `CP_Arc.md` file now serves as the canonical architecture overview you can feed into downstream documentation workflows or external LLM summarizers.

## Appendix: Repository Tree

The following tree captures the project structure (common bulky folders such as `node_modules` or build outputs are omitted for clarity):

```
./
    .editorconfig
    .gitignore
    .replit
    CP_Arc.md
    Course_Platform.md
    README.md
    Web Dev using AI Course Content.pdf
    cred.txt
    normalize.py
    patch.diff
    task_progress.md
    temp_patch.py
    temp_patch.txt
    topics_all_modules.csv
backend/
    .env
    .env.example
    README.md
    package-lock.json
    package.json
    tsconfig.build.json
    tsconfig.json
    vitest.config.ts
    prisma/
        schema.prisma
        seed.ts
        migrations/
            20241119_reconcile_tutor_applications/
                migration.sql
            20241119_update_tutor_applications/
                migration.sql
            20251015000136_add_cart_items/
                migration.sql
            20251113114500_course_pages_support/
                migration.sql
    scripts/
        .gitkeep
        ingestCourseContent.ts
    src/
        app.ts
        server.ts
        config/
            env.ts
        middleware/
            requireAuth.ts
        rag/
            neo4jClient.ts
            openAiClient.ts
            pii.ts
            ragService.ts
            rateLimiter.ts
            textChunker.ts
            usageLogger.ts
        routes/
            assistant.ts
            auth.ts
            cart.ts
            courses.ts
            health.ts
            lessons.ts
            lessons.ts.bak
            pages.ts
            tutorApplications.ts
            users.ts
        services/
            cartService.ts
            googleOAuth.ts
            prisma.ts
            sessionService.ts
            userService.ts
        utils/
            asyncHandler.ts
            oauthState.ts
    tests/
        health.test.ts
docs/
    App Changes.md
    backend-dev-log.md
    databaseSchema.md
    design_guidelines.md
    project-structure.md
    project-walkthrough oauth documentaion.md
    legacy/
        drizzle.config.ts
        server/
            db.ts
            index.ts
            routes.ts
            seed.ts
            storage.ts
            vite.ts
frontend/
    .env
    .env.example
    README.md
    components.json
    index.html
    package-lock.json
    package.json
    postcss.config.js
    tailwind.config.ts
    tsconfig.json
    vite.config.ts
    .vite/
        deps_temp_abf87e0d/
    src/
        App.tsx
        index.css
        main.tsx
        assets/
            external/
                
        components/
            AssessmentResults.tsx
            ChatBot.tsx
            CourseSidebar.tsx
            EnrollmentGateway.tsx
            LessonTabs.tsx
            QuizCard.tsx
            ThemeToggle.tsx
            VideoPlayer.tsx
            examples/
                AssessmentResults.tsx
                CourseSidebar.tsx
                EnrollmentGateway.tsx
                LessonTabs.tsx
                QuizCard.tsx
                ThemeToggle.tsx
                VideoPlayer.tsx
            layout/
                SiteHeader.tsx
                SiteLayout.tsx
            ui/
                accordion.tsx
                alert-dialog.tsx
                alert.tsx
                aspect-ratio.tsx
                avatar.tsx
                badge.tsx
                breadcrumb.tsx
                button.tsx
                calendar.tsx
                card.tsx
                carousel.tsx
                chart.tsx
                checkbox.tsx
                collapsible.tsx
                command.tsx
                context-menu.tsx
                dialog.tsx
                drawer.tsx
                dropdown-menu.tsx
                form.tsx
                hover-card.tsx
                input-otp.tsx
                input.tsx
                label.tsx
                menubar.tsx
                navigation-menu.tsx
                pagination.tsx
                popover.tsx
                progress.tsx
                radio-group.tsx
                resizable.tsx
                scroll-area.tsx
                select.tsx
                separator.tsx
                sheet.tsx
                sidebar.tsx
                skeleton.tsx
                slider.tsx
                switch.tsx
                table.tsx
                tabs.tsx
                textarea.tsx
                toast.tsx
                toaster.tsx
                toggle-group.tsx
                toggle.tsx
                tooltip.tsx
        constants/
            navigation.ts
            theme.ts
        hooks/
            use-mobile.tsx
            use-toast.ts
        lib/
            api.ts
            queryClient.ts
            utils.ts
        pages/
            AboutPage.tsx
            AssessmentPage.tsx
            AuthCallbackPage.tsx
            AuthPage.tsx
            BecomeTutorPage.tsx
            CartPage.tsx
            CoursePlayerPage.tsx
            CoursesPage.tsx
            DashboardPage.tsx
            EnrollmentPage.tsx
            not-found.tsx
            examples/
                AssessmentPage.tsx
                CoursePlayerPage.tsx
                EnrollmentPage.tsx
        types/
            cart.ts
            content.ts
            session.ts
        utils/
            session.ts
infrastructure/
    README.md
    docker-compose.yml
    db/
        .gitkeep
rag/
    Rag Chat Bot.ipynb
    metadata.json
scripts/
    dev.ps1
    dev.sh
shared/
    schema.ts
```

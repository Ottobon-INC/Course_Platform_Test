# Course Platform - Full Project Documentation

Version: January 2026 monorepo snapshot (frontend + backend + shared assets)

## Table of contents
1. Project overview
2. Feature map
3. Repository structure
4. Technology stack
5. Environment and configuration
6. Frontend architecture
7. Backend architecture
8. Data model highlights
9. End-to-end experience flows
10. Runtime constants
11. Testing and troubleshooting
12. Deployment checklist

## 1. Project overview
The Course Platform delivers an Ottolearn-branded learning experience for browsing, enrolling, and completing AI-focused courses. A React SPA drives the marketing pages, course detail funnel, and the learning environment (player, quizzes, tutor, certificate). A TypeScript Express API sits behind `/api` (mirrored at `/`), handling OAuth, enrollment writes, module content, quizzes, tutor prompts, CMS pages, and tutor applications.

Canonical course slug in the seed data is `ai-in-web-development` (course name: `AI Native Full Stack Developer`).

## 2. Feature map
- Multi-course catalog seeded in `backend/prisma/seed.ts` (primary focus is the AI Native Full Stack Developer course).
- Marketing and discovery pages: landing, methodology, more-info, cohort/on-demand/workshop collections.
- Cohort allowlist gate (cohorts + cohort_members) for enrollment; browsing remains public.
- Dynamic course player with block-based content, video, study material, PPT, simulation exercises, cold calling, quizzes, and AI tutor.
- Study personas (sports/cooking/adventure) stored per learner/course; switching back to normal does not delete saved persona.
- Tutor persona profiles stored in `learner_persona_profiles` and used for content asset resolution and tutor prompts.
- Master/derived content system: layout JSON in `topics.text_content`, payloads in `topic_content_assets`.
- Cohort batch projects: per-batch project briefs surfaced in the course player header.
- Quiz-driven module gating with cooldown windows and progress tracking.
- AI tutor with pgvector RAG, prompt suggestions, and persistent chat memory.
- Tutor telemetry monitor with learner activity events.
- **Intelligent Landing Agent**: Sales-focused chatbot with RAG integration, personalized greetings, and follow-up suggestion throttling.
- Commerce surfaces (cart, enrollments) are present but only partially surfaced in routing.

## 3. Repository structure (high level)
```
./
  CP_Arc.md, Course_Platform.md, README.md, Frontend.md, task_progress.md
  Web Dev using AI Course Content.pdf
  AI Native Full Stack Developer.pdf
  frontend/        # React + Vite SPA
  backend/         # Express + Prisma API
  docs/            # Documentation bundle
```
Optional: JSON exports for `rag:import` are stored outside the repo and loaded via `backend/scripts/importCourseChunks.ts`.

## 4. Technology stack
| Concern | Implementation |
| --- | --- |
| Frontend runtime | React 18, TypeScript, Vite, Wouter, TanStack Query |
| UI system | Tailwind CSS, shadcn/ui components, Lucide icons |
| State/session | Local storage + heartbeat (`utils/session.ts`) |
| Backend runtime | Node 20, Express 4, TypeScript |
| ORM & DB | Prisma 6, PostgreSQL (Supabase compatible) |
| Auth | Google OAuth 2.0, JWT access + refresh tokens |
| Vector store | PostgreSQL + pgvector |
| AI provider | OpenAI (embeddings + chat completions) |

## 5. Environment and configuration
Key environment variables (see backend/.env.example and frontend/.env.example):
- `PORT` - Express listen port (default 4000).
- `FRONTEND_APP_URLS` - comma separated list of allowed origins.
- `DATABASE_URL` - Postgres connection string.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TOKEN_TTL_SECONDS`, `JWT_REFRESH_TOKEN_TTL_DAYS`.
- `OPENAI_API_KEY`, `LLM_MODEL`, `EMBEDDING_MODEL`.
- Frontend `.env`: `VITE_API_BASE_URL` (API base URL for `buildApiUrl`).
- Navbar OAuth uses `VITE_API_URL` in `frontend/src/App.tsx` (keep aligned or unify).

## 6. Frontend architecture
### Routing (from `frontend/src/App.tsx`)
| Path | Component |
| --- | --- |
| `/` | LandingPage |
| `/become-a-tutor` | BecomeTutorPage |
| `/methodology` | MethodologyPage |
| `/more-info` | MoreInfoPage |
| `/our-courses/cohort` | CohortPage |
| `/our-courses/on-demand` | OnDemandPage |
| `/our-courses/workshops` | WorkshopPage |
| `/tutors` | TutorDashboardPage |
| `/auth/callback` | AuthCallbackPage |
| `/course/:id` | CourseDetailsPage |
| `/course/:id/enroll` | EnrollmentPage (legacy) |
| `/course/:id/path` | LearningPathPage |
| `/course/:id/learn/:lesson` | CoursePlayerPage |
| `/course/:id/assessment` | AssessmentPage (legacy) |
| `/course/:id/congrats` | CongratsPage |
| `/course/:id/congrats/feedback` | CongratsFeedbackPage |
| `/course/:id/congrats/certificate` | CourseCertificatePage |
| `*` | NotFound |

Notes:
- The marketing navbar is hidden on `/course/*` routes.
- `AuthPage`, `TutorLoginPage`, `CoursesPage`, `DashboardPage`, `CartPage`, `AboutPage` exist but are not wired in `App.tsx`.
- **LandingChatBot**: Embedded in `LandingPage` for visitor support.


### Course player highlights
- Hydrates topics from `GET /lessons/courses/:courseKey/topics`.
- Renders block-based JSON when `topics.text_content` contains a derived layout.
- Study Material header appears before the first text block; video-first layouts render without a header above.
- The first text block can attach the next image block under the same card.
- Read Mode collapses video blocks with smooth transitions and auto-scrolls to the top.
- Cohort Project button fetches `/cohort-projects/:courseKey` and opens a project brief modal.
- Study persona selection is stored in `topic_personalization` and affects text variants.

## 7. Backend architecture
### Router matrix
| Router | Responsibilities |
| --- | --- |
| authRouter | Google OAuth redirect/callback, token refresh, logout |
| coursesRouter | Catalog fetch, course resolution, enrollments + cohort access |
| lessonsRouter | Topics, personalization, progress CRUD, content resolution |
| cohortProjectsRouter | Cohort batch project lookup |
| quizRouter | Sections, attempts, submissions, module gating |
| assistantRouter | Tutor chat with RAG and chat memory |
| landingAssistantRouter | Public sales chatbot (generic queries, RAG) |
| coldCallRouter | Cohort prompts, replies, stars |
| activityRouter | Telemetry ingestion + tutor monitoring |
| tutorsRouter | Tutor login, dashboards, copilot |
| personaProfilesRouter | Tutor persona analysis |

### Master/derived JSON resolution
Derived layout JSON is stored in `topics.text_content`:
```json
{
  "version": "1.0",
  "blocks": [
    { "id": "block-1", "type": "video", "contentKey": "t1-intro-video" },
    { "id": "block-2", "type": "text", "contentKey": "t1-intro-text" },
    { "id": "block-3", "type": "ppt", "contentKey": "t1-intro-ppt" }
  ]
}
```

Master content lives in `topic_content_assets`:
```json
{
  "content_key": "t1-intro-video",
  "content_type": "video",
  "persona_key": "non_it_migrant",
  "payload": { "url": "https://www.youtube.com/embed/...", "title": "Intro" }
}
```

`lessonsRouter` resolves each `contentKey` by tutor persona (from `learner_persona_profiles`), falls back to `persona_key = null`, and returns resolved blocks to the frontend.

## 8. Data model highlights
- `topics` still carries legacy fields (`video_url`, `ppt_url`, `text_content_*`).
- `topic_content_assets` is the master store for persona-aware content payloads.
- `topic_personalization` stores study narrator preference.
- `learner_persona_profiles` stores tutor personas used for content resolution and tutor prompts.
- `cohort_batch_projects` stores project briefs per cohort batch.
- `course_chunks` stores RAG embeddings (pgvector) keyed by `course_id` string.

See `docs/databaseSchema.md` for detailed diagrams.

## 9. End-to-end experience flows
### 9.1 Enrollment and personalization
1. `CourseDetailsPage` checks cohort eligibility with `POST /courses/:courseKey/enroll?checkOnly=true`.
2. Enrollment writes to `enrollments` on success.
3. If no study persona exists, the learner is routed to `/course/:courseKey/path`.

### 9.2 Lesson playback
1. `CoursePlayerPage` loads topics and renders the layout.
2. Progress updates via `PUT /lessons/:lessonId/progress`.
3. Cold calling prompts appear after study material.

### 9.3 Cohort projects
1. The header button calls `/cohort-projects/:courseKey`.
2. The modal displays `payload.title`, `payload.tagline`, `payload.description`, and `payload.notes`.

### 9.4 Tutor chat
1. Prompt suggestions come from `/lessons/courses/:courseKey/prompts`.
2. `/assistant/session` hydrates chat history.
3. `/assistant/query` runs the RAG pipeline and applies typed prompt quotas.

## 10. Runtime constants
- RAG top-K contexts: 5.
- Chunk size 900, overlap 150.
- Rate limit: 8 tutor requests per 60 seconds per user.
- Typed prompt quota: 5 per module.
- Quiz passing threshold: 70%.
- Quiz default limit: 5 questions (max 20).
- Module cooldown window: 7 days.

## 11. Testing and troubleshooting
- Ensure `topics.text_content` JSON parses and `topic_content_assets` rows exist for each `contentKey`.
- If Cohort Project modal shows "not assigned", check `cohort_batch_projects` and `cohort_members.batch_no`.
- RAG ingestion must use the same `course_id` string that `/assistant/query` resolves to (UUID vs slug mismatches will return no contexts).
- OAuth errors: verify redirect URIs and `FRONTEND_APP_URLS`.

## 12. Deployment checklist
1. Set backend env vars and frontend `VITE_API_BASE_URL` (and keep `VITE_API_URL` in sync).
2. Apply Prisma migrations.
3. Enable pgvector (`CREATE EXTENSION vector;`).
4. Seed cohort allowlists, cold call prompts, topic content assets, and quiz questions.
5. Ingest RAG content with `npm run rag:ingest` or import with `rag:import`.
6. Build and deploy backend and frontend.

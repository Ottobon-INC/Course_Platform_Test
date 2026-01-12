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
The Course Platform delivers a LearnHub-branded experience for browsing, enrolling in, and completing AI-centric coursework. A React SPA drives every learner touchpoint (landing page, enrollment funnel, course player, quizzes, tutor, certificate). A TypeScript Express API sits behind `/api`, handling OAuth, enrollment writes, module content, quiz scoring, tutor prompts, CMS pages, and tutor applications.

Canonical course slug: `ai-native-fullstack-developer` (legacy `ai-in-web-development` links resolve via backend slug resolution).

## 2. Feature map
- Single-course marketing funnel with live curriculum data and a deep link into the course player.
- Cohort allowlist gate (cohorts + cohort_members) for enrollment, while browsing remains public.
- Dynamic course player with video, study material, PPT, simulation exercises, cold calling, quizzes, and AI tutor.
- Study personas (sports/cooking/adventure) stored per learner/course; switching back to Standard never deletes the saved persona.
- Tutor persona profiles stored in `learner_persona_profiles` and used to personalize tutor responses and content assets.
- Master/derived content system: layout JSON stored in `topics.text_content`, content payloads stored in `topic_content_assets`.
- Cohort batch projects: per-batch project briefs surfaced in the course player header.
- Quiz-driven module gating with cooldown windows and progress tracking.
- AI tutor with pgvector RAG, prompt suggestions, and persistent chat memory.
- Tutor telemetry monitor with learner activity events.

## 3. Repository structure (high level)
```
./
  CP_Arc.md, Course_Platform.md, README.md, Frontend.md, task_progress.md
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
- Frontend `.env`: `VITE_API_BASE_URL`.

## 6. Frontend architecture
### Routing
| Path | Component |
| --- | --- |
| `/` | LandingPage |
| `/course/:id` | CourseDetailsPage |
| `/course/:id/learn/:lesson` | CoursePlayerPage |
| `/course/:id/path` | LearningPathPage |
| `/course/:id/congrats/certificate` | CourseCertificatePage |
| `/tutors` | TutorDashboardPage |
| `/become-a-tutor` | BecomeTutorPage |

### Course player highlights
- Hydrates topics from `GET /lessons/courses/:courseKey/topics`.
- Renders block-based JSON when `topics.text_content` contains a derived layout.
- Study header appears before the first text block; video-first layouts render without a header above.
- The first text block can attach the next image block under the same card.
- Read Mode collapses video blocks with smooth transitions and auto-scrolls to the top.
- Cohort Project button fetches `/cohort-projects/:courseKey` and opens a project brief modal.
- Study persona selection is stored in `topic_personalization`.

## 7. Backend architecture
### Router matrix
| Router | Responsibilities |
| --- | --- |
| authRouter | Google OAuth redirect/callback, token refresh, logout |
| coursesRouter | Catalog fetch, slug/UUID/name resolution, enrollments |
| lessonsRouter | Topics, progress CRUD, study personas, prompt suggestions, content resolution |
| cohortProjectsRouter | Cohort batch project lookup |
| quizRouter | Sections, attempts, submissions, module gating |
| assistantRouter | Tutor chat with RAG and chat memory |
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

`lessonsRouter` resolves each block by persona, falls back to `persona_key = null`, and returns resolved blocks to the frontend.

## 8. Data model highlights
- `topics` still carries legacy fields (`video_url`, `ppt_url`, `text_content_*`).
- `topic_content_assets` is the master store for persona-aware content payloads.
- `topic_personalization` stores study narrator preference.
- `learner_persona_profiles` stores tutor personas used for content resolution and tutor prompts.
- `cohort_batch_projects` stores project briefs per cohort batch.

See `docs/databaseSchema.md` for detailed diagrams.

## 9. End-to-end experience flows
### 9.1 Enrollment and personalization
1. CourseDetails checks cohort eligibility with `POST /courses/:slug/enroll?checkOnly=true`.
2. Enrollment writes to `enrollments` on success.
3. If no study persona exists, the user is routed through `/course/:slug/path`.

### 9.2 Lesson playback
1. `CoursePlayerPage` loads topics and renders the layout.
2. Progress updates via `PUT /lessons/:lessonId/progress`.
3. Cold calling prompts appear after study material.

### 9.3 Cohort projects
1. The header button calls `/cohort-projects/:courseKey`.
2. The modal displays `payload.title`, `payload.tagline`, `payload.description`, and `payload.notes`.

### 9.4 Tutor chat
1. Prompt suggestions come from `/lessons/courses/:slug/prompts`.
2. `/assistant/query` runs the RAG pipeline and applies typed prompt quotas.

## 10. Runtime constants
- RAG top-K contexts: 5.
- Chunk size 900, overlap 150.
- Rate limit: 8 tutor requests per 60 seconds per user.
- Typed prompt quota: 5 per module.
- Quiz passing threshold: 70%.

## 11. Testing and troubleshooting
- Ensure `topics.text_content` JSON parses and `topic_content_assets` rows exist for each `contentKey`.
- If Cohort Project modal shows "not assigned", check `cohort_batch_projects` and `cohort_members.batch_no`.
- RAG ingestion: `npm run rag:ingest <pdf> <slug> "<Course Title>"`.

## 12. Deployment checklist
1. Set backend env vars and frontend `VITE_API_BASE_URL`.
2. Apply Prisma migrations.
3. Enable pgvector (`CREATE EXTENSION vector;`).
4. Seed cohort allowlists, cold call prompts, and topic content assets.
5. Build and deploy backend and frontend.

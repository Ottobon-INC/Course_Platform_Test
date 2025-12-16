# Course Platform – Full Project Documentation

> Version: December 2025 monorepo snapshot (frontend + backend + shared assets)

## Table of Contents
1. Project overview
2. Feature map
3. Repository structure
4. Technology stack
5. Environment and configuration
6. Frontend architecture
7. Backend architecture
8. Data model highlights
9. End-to-end experience flows
10. Testing and troubleshooting
11. Deployment checklist

## 1. Project Overview
The Course Platform delivers a LearnHub-branded experience for browsing, enrolling in, and completing AI-centric coursework. A single React SPA drives every learner touchpoint (landing page, enrollment funnel, course player, quizzes, tutor, certificate). A TypeScript Express API sits behind `/api`, handling OAuth, enrollment writes, module content, quiz scoring, tutor prompts, CMS pages, and tutor applications. The entire system is documented so another engineer—or an external LLM—can rebuild the experience without touching the rest of the repository.

## 2. Feature Map
- **Single-course marketing funnel** with live curriculum data, responsive hero sections, skills badges, and the MetaLearn enrollment protocol.
- **Auto-enrollment** – when a learner accepts the protocol, the SPA calls `POST /courses/:slug/enroll` so every cohort is tracked in Postgres.
- **Dynamic course player** – sidebar hierarchy, optimistic progress updates, persona-aware study guides, slides, simulations, and integrated tutor chat.
- **Personalised narration** – questionnaire-based personas (sports, cooking, adventure) stored per learner/course. Switching back to Standard never discards the saved persona, so returning learners can flip between both options instantly.
- **Quiz-driven progression** – module unlocks tied to quiz attempts, cooldown windows, and module progress tracking in `module_progress`.
- **AI tutor dock** – typed questions plus curated prompt suggestions, RAG on top of Neo4j embeddings, prompt quotas per module, and success/failure logging.
- **Certificate preview** – shows a blurred certificate until payment is collected (Razorpay hook placeholder in place).
- **Tutor intake + CMS** – forms for aspiring tutors, plus CMS-driven `page_content` for static pages.

## 3. Repository Structure (high level)
```
./
  CP_Arc.md, Course_Platform.md, task_progress.md
  frontend/        # React + Vite SPA
  backend/         # Express + Prisma API
  docs/            # Living documentation bundle
  infrastructure/  # docker-compose for Postgres + pgAdmin
  scripts/         # Dev helpers
  shared/          # Cross-cutting schema/types (placeholder)
```
`docs/project-structure.md` provides a deeper tree with notable files for each workspace.

## 4. Technology Stack
| Concern | Implementation |
| --- | --- |
| Frontend runtime | React 18, TypeScript, Vite, Wouter, TanStack Query |
| UI system | Tailwind CSS, shadcn/ui components, Lucide icons |
| State/session | Local storage + heartbeat (utils/session.ts), React hook utilities |
| Backend runtime | Node 20, Express 4, TypeScript, tsx for dev |
| ORM & DB | Prisma 5, PostgreSQL (Supabase-compatible) |
| Auth | Google OAuth 2.0, JWT access + refresh tokens, hashed refresh storage |
| Vector store | Neo4j Aura with native vector index |
| AI provider | OpenAI (embeddings + chat completions) |
| Testing | Vitest + Supertest scaffolding (backend) |

## 5. Environment and Configuration
Key environment variables (see backend/.env.example and frontend/.env.example):
- `PORT` – Express listen port (default 4000).
- `FRONTEND_APP_URLS` – comma separated list of allowed origins (used by CORS and OAuth redirect validation).
- `DATABASE_URL` – Postgres connection string.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` – OAuth credentials.
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TOKEN_TTL_SECONDS`, `JWT_REFRESH_TOKEN_TTL_DAYS` – token signing + expiry.
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `NEO4J_URL`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` – tutor pipeline.
- Frontend `.env` only needs `VITE_API_BASE_URL` (default http://localhost:4000) plus any analytics keys.

## 6. Frontend Architecture
### Routing
| Path | Component | Notes |
| --- | --- | --- |
| `/` | LandingPage | Marketing hero, stats, CTA buttons tied to enrollment or direct player entry |
| `/course/:id` | CourseDetailsPage | Curriculum, MetaLearn modal, auto enrollment and questionnaire hand-off |
| `/course/:id/learn/:lesson` | CoursePlayerPage | Core learning space with sidebar, lesson tabs, tutor, quiz tab |
| `/course/:id/path` | Study style questionnaire page (mounted inside CoursePlayerPage) |
| `/course/:id/certificate` | CourseCertificatePage | Certificate preview and payment CTA |
| `/course/:id/enroll`, `/course/:id/assessment` | Enrollment and assessment placeholders (kept for future steps) |
| `/auth/callback` | AuthCallbackPage | Stores OAuth tokens and redirects |
| `/become-a-tutor` | BecomeTutorPage | Tutor application form |
| `*` | NotFound | Generic 404 |

### State management patterns
- **Session heartbeat** – components subscribe via `subscribeToSession`; if the refresh request fails, the subscription callback clears state.
- **API helpers** – `api.ts` builds URLs and attaches Authorization headers. `queryClient.ts` wraps fetch and ensures headers merge correctly.
- **Toasts and modals** – `use-toast.ts` (shadcn pattern) ties into global `<Toaster />`.
- **Sidebar state** – `CourseSidebar` memoises module expansion, search filtering, and completion toggles.

### Course player highlights
- Hydrates introduction + numbered modules from `/lessons/courses/:slug/topics`.
- Stores persona selections via `/lessons/courses/:slug/personalization`; questionnaire uses three prompts defined in CoursePlayerPage.tsx.
- Guides use persona-specific fields; fallback to `textContent` when persona copy is missing.
- Video/PPT players are hardened (no share buttons, no context menu, referrer locked down).
- Quiz tab interacts with `/quiz/sections`, `/quiz/progress`, `POST /quiz/attempts`, and submission endpoints.
- Tutor dock sends typed prompts as `{ courseId: slug, moduleNo, question }` or calls curated prompt suggestions retrieved from `/lessons/courses/:slug/prompts`.

### Course details page
- Fetches `/courses/:slug` for metadata plus `/lessons/courses/:slug/topics` to render modules timeline.
- Promo pricing (free cohort or INR fallback) determined locally based on slug.
- After enrollment, checks personalization preference: if `hasPreference` is false the learner is routed through `/course/:slug/path` before landing inside `/learn`.

### Certificate page
- Reads `courseCertificateName`/`courseCertificateTitle` from local storage or session info.
- Placeholder Razorpay integration illustrates how the paid unlock would be wired.

## 7. Backend Architecture
### Server bootstrap
- `src/server.ts` loads validated env config and starts the Express app.
- `src/app.ts` wires body parsing, cookie parsing, CORS, routers (mounted twice), and the error handler.

### Router matrix
| Router | Responsibilities |
| --- | --- |
| authRouter | Google OAuth redirect/callback, ID token verification, token refresh, logout |
| coursesRouter | Course catalog fetch, slug/UUID/name resolution, idempotent enroll writes |
| lessonsRouter | Course topics, module-scoped topics, topic progress CRUD, study persona CRUD, curated prompt suggestions |
| quizRouter | Quiz question fetch, sections/progress summary, attempt creation, submission grading, module progress updates |
| assistantRouter | Authenticated tutor endpoint (typed prompt quotas, follow-up suggestions, RAG pipeline) |
| cartRouter | Authenticated cart CRUD backed by cart_items |
| pagesRouter | CMS page retrieval |
| tutorApplicationsRouter | Tutor lead intake |
| usersRouter | `/users/me` profile lookup |
| healthRouter | `/health` liveness (includes DB connectivity check) |

### Key services
- `sessionService.ts` – validates/creates JWTs, hashes refresh tokens in `user_sessions`, rotates them on refresh.
- `googleOAuth.ts` – wraps google-auth-library for code exchange and profile fetch.
- `enrollmentService.ts` – upserts enrollments on behalf of coursesRouter.
- `promptUsageService.ts` – enforces per-module typed prompt quotas (default 5).
- `rag/*` – driver + openAI helpers, text chunker, rate limiter, usage logger (used by assistant router and ingestion scripts).

## 8. Data Model Highlights
- **users** – OAuth-sourced learners; passwords are placeholder hashes (Google-only login right now).
- **user_sessions** – hashed refresh tokens with expiry timestamps.
- **courses** – slug, title, description, price, metadata for CourseDetails.
- **topics** – moduleNo/topicNumber ordering, persona text fields, ppt/video URLs, optional simulation JSON.
- **topic_progress** – per learner/topic completion + lastPosition (percentage proxy for now).
- **topic_personalization** – learner/course persona preference.
- **topic_prompt_suggestions** – curated tutor prompts with optional follow-up suggestions and answers.
- **module_prompt_usage** – per learner/course/module typed prompt counters.
- **quiz_questions / quiz_options / quiz_attempts / module_progress** – module gating infrastructure.
- **cart_items**, **enrollments**, **tutor_applications**, **page_content** – supporting tables for cart, enrollment history, tutor lead gen, and CMS pages.
- See docs/databaseSchema.md for detailed diagrams and relationships.

## 9. End-to-End Experience Flows
### 9.1 Login
1. Frontend hits `/auth/google` (optionally with a `redirect` param) -> backend issues state cookie and redirects to Google.
2. `/auth/google/callback` exchanges the code, persists/updates the user, issues JWTs, stores hashed refresh token, and redirects to `/auth/callback`.
3. Auth callback persists the session, surfaces a toast, and navigates based on redirect param (defaults to featured course).

### 9.2 Enrollment + persona capture
1. CourseDetails fetches curriculum using the same API as the player to avoid drift.
2. Accepting the protocol ensures the session is fresh, calls the enroll endpoint, and closes the modal.
3. If `/lessons/courses/:slug/personalization` reports `hasPreference = false`, CourseDetails routes the learner to `/course/:slug/path` so the questionnaire runs before the player loads.
4. Learners who once picked a persona can always toggle back to it even after logging out; the server stores the persona in `topic_personalization` while the client caches a `personaHistoryKey` for faster UI toggles.

### 9.3 Lesson playback
1. CoursePlayerPage fetches topics, groups them per module, picks the entry lesson (introduction > module order), and renders `CourseSidebar`.
2. When the active lesson changes, the page calls `GET /lessons/:lessonId/progress` to hydrate the latest state.
3. Completing a lesson triggers `PUT /lessons/:lessonId/progress` with `{ progress, status }` and updates counts shown in the sidebar header.

### 9.4 Quiz progression
1. Quiz tab loads `/quiz/sections/:slug` to determine which module/topic pair is currently unlocked, locked by cooldown, or pending another quiz.
2. Starting a quiz uses `POST /quiz/attempts`; the backend stores a frozen question set and returns it without answer metadata.
3. Submissions grade server-side, write back to `quiz_attempts`, and if the last topic pair of a module passes, `module_progress` is updated so the next module unlocks (unless cooldowns are still active).

### 9.5 Tutor prompts
1. Chat dock fetches curated prompt suggestions via `/lessons/courses/:slug/prompts` (optionally per topic ID).
2. Typed prompts call `/assistant/query` with `{ courseId, moduleNo, question }`; the backend verifies the prompt quota for that module, embeds the question, retrieves contexts from Neo4j, calls OpenAI, and returns the answer.
3. Suggestions with canned answers skip OpenAI entirely, returning the pre-authored content along with follow-up suggestions.
4. All requests run through `assertWithinRagRateLimit` plus the module quota to throttle abuse.

### 9.6 Certificate preview
1. After all modules pass, the player exposes a certificate CTA that links to `/course/:slug/certificate`.
2. The certificate page reads the stored learner name and course title, renders a blurred preview, and provides the Razorpay placeholder for the paid unlock.

## 10. Testing and Troubleshooting
- **Backend**: `npm run test` (Vitest) for unit/integration tests. Add Supertest suites for routers touching personalization and quiz grading.
- **Frontend**: run `npm run lint` (if configured) and eventually add Vitest/RTL suites for CoursePlayerPage, CourseSidebar, and persona dialog.
- **Common issues**:
  - Quiz POST returning 400 -> ensure `Content-Type: application/json` is present (fixed in queryClient). If reproducing, confirm `api.ts` is not bypassed.
  - Tutor returning 429 -> learner likely exhausted typed prompt quota for that module.
  - Persona dialog not loading -> verify `/lessons/courses/:slug/personalization` returns 200 (requires auth) and that `topic_personalization` row exists.
  - RAG ingestion -> run `npm run rag:ingest <pdf> <slug> "<Course Title>"` from backend/ after populating `.env` with Neo4j + OpenAI credentials.

## 11. Deployment Checklist
1. **Secrets** – set all backend env vars + frontend `VITE_API_BASE_URL`.
2. **Database** – apply Prisma migrations (`npx prisma migrate deploy`) on the target Postgres instance.
3. **Neo4j** – ensure Aura instance is reachable from the API host; run the ingestion script at least once per course slug.
4. **Google OAuth** – add the production backend callback plus SPA callback to the OAuth client.
5. **Builds** – `npm run build` in frontend (produces `dist/`) and `npm run build` in backend (tsc out to `dist/`).
6. **Hosting** – deploy the API (Render/Fly/Railway), deploy the SPA (Vercel/Netlify), configure HTTPS, and update `FRONTEND_APP_URLS` + OAuth redirect URIs.
7. **Smoke tests** – login via Google, enroll, run the persona questionnaire, play a lesson with persona copy, pass a quiz, ask the tutor, and visit the certificate page.

This documentation, together with CP_Arc.md and docs/project-walkthrough.md, gives an external reader full insight into how the Course Platform behaves end to end without opening the rest of the repository.

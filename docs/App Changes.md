# App Changes

Living changelog for the Course Platform. Each section captures what changed, why we changed it, and the primary files involved so stakeholders (or external LLMs) can trace the history of the learner experience.

## 2025-12-24 – RAG moved to Postgres pgvector
- **Supabase vector store** – `backend/src/rag/ragService.ts` now reads/writes `course_chunks` in Postgres via pgvector similarity search, fully removing Neo4j from the runtime path.
- **Import script** – `backend/scripts/importCourseChunks.ts` can ingest JSON exports with precomputed embeddings to avoid re-embedding costs.

## 2025-12-15 – Personalized learning always recoverable
- **Saved personas survive Standard detours** – `frontend/src/pages/CoursePlayerPage.tsx` now derives a `personaHistoryKey` per user/course, reads any stored preference from `/lessons/courses/:slug/personalization`, and always offers the previously unlocked persona in addition to Standard. Switching to Standard no longer deletes the personalized narrator.
- **Standard-first learners re-enter the questionnaire** – when a learner who stayed on Standard clicks the Personalised tab mid-course, the same three-question survey shown during enrollment opens, posts to `/lessons/courses/:slug/personalization`, and stores the resulting persona for future sessions.
- **Accessible study-style dialog** – every prompt, chip, and CTA in the questionnaire modal now uses high-contrast text colors (`text-[#000000]` / `text-[#4a4845]`) so content is visible even before the learner hovers or highlights the text.

## 2025-12-05 – Enrollment autopilot, tutor quotas, certificate polish
- **Auto enrollment CTA** – `frontend/src/pages/CourseDetailsPage.tsx` calls the new `POST /courses/:courseKey/enroll` (`backend/src/routes/courses.ts` + `services/enrollmentService.ts`). Learners are added to `enrollments` the moment they accept the protocol, ensuring analytics and tutor reports no longer lag behind.
- **Tutor prompt quotas** – `backend/src/routes/assistant.ts` pairs user IDs with course/module quotas stored via `services/promptUsageService.ts` and the `module_prompt_usage` table. Typed prompts now return HTTP 429 with a helpful message once a learner exceeds the module allotment. Follow-up suggestions remain unlimited because they use curated answers.
- **Certificate CTA refresh** – `frontend/src/pages/CourseCertificatePage.tsx` guides graduates through the payment placeholder, highlights Razorpay integration points, and lets marketing copy remind learners that a clean certificate unlocks after the upgrade.

## 2025-11-27 – Landing funnel and routing cleanup
- Landing page CTAs, Auth callback, and nav links now route directly to `/course/ai-in-web-development/learn/welcome-to-ai-journey` instead of the retired dashboard/cart pages.
- Course cards for unpublished programs show a "Coming soon" toast rather than failing to navigate.
- Navigation constants and layout components were trimmed so the SPA only exposes Home and Become a Tutor alongside the learning routes.

## 2025-11-25 – Quiz payload fix
- The shared fetch helper in `frontend/src/lib/queryClient.ts` now merges headers before issuing a request, ensuring `Content-Type: application/json` is never removed when adding `Authorization`.
- `/quiz/attempts` receives real payloads again, so attempts are stored under the authenticated `user_id` instead of the anonymous fallback and module unlocks fire immediately after passing the required topic pairs.

## 2025-10-15 – Cart API and migrations
- Added full cart CRUD backed by the new `cart_items` model plus Prisma migration `20251015000136_add_cart_items`.
- Cart UI (Dashboard + Cart pages) now talks to `/cart` instead of local storage and respects auth/logout flows.

## 2025-10-09 – Dynamic course content + player polish
- `backend/src/routes/lessons.ts` gained course-scoped endpoints that stream every module/topic, normalise YouTube URLs, and expose persona-specific guide text.
- `CoursePlayerPage.tsx` rebuilds the sidebar from live data (Introduction + modules 1-n), slugifies topics for routing, and hydrates module progress for the updated `CourseSidebar`.
- `LessonTabs.tsx` converts raw plain text into Markdown-friendly content with consistent heading/list formatting.
- Session helpers (`frontend/src/utils/session.ts`) gained a refresh heartbeat used by Dashboard, Cart, and the player so JWTs refresh silently and logouts clear state safely.

## 2025-10-08 – Monorepo bootstrap
- Split the legacy project into `frontend/` (Vite + React) and `backend/` (Express + Prisma), added `.env.example` files, and documented the new layout in README.
- Implemented Google OAuth, JWT session creation/rotation, `/users/me`, and `/health` so the dashboard can render real profile data after signing in.

Refer to `docs/backend-dev-log.md` for backend-specific implementation notes and `task_progress.md` for the running task list.

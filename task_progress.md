# Task Progress Log

> Running log of notable tasks and changes completed on the backend + frontend stack of the Course Platform project.

## 2025-10-08 — Project Kickoff

- **Repository restructure for Vite + Express monorepo**  
  Migrated the legacy client assets into the new `frontend/` workspace, archived previous server scripts under `docs/legacy/`, and added high-level documentation to clarify the refreshed architecture.

- **PostgreSQL data model with Prisma**  
  Defined the core schema in `backend/prisma/schema.prisma` (users, courses, cart lines, enrollments, topics, progress, sessions) and exposed the Prisma client helper via `src/services/prisma.ts`.

- **Environment validation & configuration bootstrap**  
  Added the Zod-backed loader in `backend/src/config/env.ts`, delivered `.env.example`, and enforced mandatory secrets (database URL, Google OAuth credentials, JWT secrets, etc.).

- **Session + token infrastructure**  
  Built `sessionService.ts` to mint/verify access + refresh JWTs, hash stored refresh tokens, enforce expirations, and provide helpers for renewal and revocation.

- **Google OAuth 2.0 integration**  
  Implemented OAuth helpers (`googleOAuth.ts`, `oauthState.ts`) and the `/auth/google` + `/auth/google/callback` pipeline that exchanges codes, verifies ID tokens, persists sessions, and redirects the SPA with credentials.

- **Express API scaffolding**  
  Wired routers for auth, users, and health checks inside `backend/src/app.ts`, added the `requireAuth` middleware, and exposed `/users/me` so the dashboard can resolve the signed-in learner profile.

- **Frontend auth handshake**  
  Added `frontend/src/pages/AuthCallbackPage.tsx` to capture OAuth callback params, persist session + user data to `localStorage`, surface welcome toasts, and perform post-login navigation.

- **Dashboard/cart experience foundations**  
  Built the initial `DashboardPage.tsx` and `CartPage.tsx` screens with course catalog cards, local cart storage, enrollment CTAs, and the theme/cart badge affordances.

## 2025-10-09 — Learner Experience Enhancements

- **UI polish & shared components**  
  Expanded the reusable component set (Dropdowns, Avatars, Tabs, etc.) and wired the global `ThemeToggle`, ensuring consistent styling across dashboard, cart, and enrollment flows.

- **Course player & enrollment routes**  
  Added the modular course player view, assessment page, and enrollment wizard so learners can preview content, track lessons, and complete enrollment flows end-to-end.

## 2025-10-14

- **Fixed toast reference error after logout**  
  Added the missing `useToast` hook destructure in `frontend/src/pages/DashboardPage.tsx` so the logout flow no longer crashes Vite's runtime overlay.

- **Redesigned authenticated profile control**  
  Replaced the old avatar/logout button pairing with a dropdown-trigger profile chip (avatar, name, chevron) using Radix dropdown components. Added “Profile”, “Settings”, and “Logout” menu options.

- **Implemented per-user, persisted shopping cart**  
  - Backend: introduced a `CartItem` Prisma model, created `cartService.ts`, and exposed authenticated `/cart` routes (CRUD-like operations).  
  - Frontend: reworked dashboard/cart screens to fetch and mutate cart data through the API, cleared guest carts on logout, and synchronized carts per signed-in user with session expiration handling.

## 2025-10-15

- **Enabled secure cross-origin API calls for cart endpoints**  
  Added `cors` middleware in `backend/src/app.ts` (configured with `FRONTEND_APP_URL`) so the Vite app can send authenticated requests with `Authorization` headers; updated `backend/package.json` to include the `cors` dependency.

- **Added Prisma migration for cart storage**  
  Created `prisma/migrations/20251015000136_add_cart_items/migration.sql` to create the `cart_items` table with the composite unique index required by the new cart service.

- **Regenerated Prisma client & hardened cart provisioning**  
  Unblocked `prisma.cartItem` usage by regenerating the client and updating `cartService.ts` to auto-create the `cart_items` table/index using the Prisma connection (no manual DB prep required).

## 2025-11-25 — Quiz API & Progress Fix

- **Resolved quiz payload validation failures**  
  Updated the shared `apiRequest` helper (frontend) to merge `Authorization` headers with `Content-Type: application/json` instead of overwriting it. Quiz start/submit mutations now send well-formed JSON, so `/api/quiz/attempts` receives the real `{ courseId, moduleNo, topicPairIndex }` payload.

- **Per-user quiz attempts restored**  
  With the correct payload and bearer token reaching Express, `quiz_attempts.user_id` is populated with the authenticated learner instead of the default `00000000-0000-0000-0000-000000000000`. Module unlock logic in `module_progress` therefore advances immediately after both topic pairs pass.

- **Frontend verification**  
  Course player displays all 12 topic-pair quizzes, auto unlocks module 2 once module 1 pairs are passed, and surfaces quiz attempt history without errors.

## 2025-11-27 — Landing Page Redirect & Course Guardrails

- **Single home route, no legacy dashboard**  
  Removed `/dashboard`, `/courses`, `/cart`, and related navigation from the SPA router. The landing page at `/` is now the sole entry point, with tutor apply and course player routes retained.
- **Auth flow drops into course player**  
  Google OAuth redirect and all login buttons now send users directly to `/course/ai-in-web-development/learn/welcome-to-ai-journey`; auth callback uses the same default.
- **Enroll guard for unpublished courses**  
  “Enroll” actions on landing page course cards only deep-link the published course (`ai-in-web-development`); other cards show a “Coming soon” toast instead of hitting the backend and causing 400/404s.
- **Navigation tightened**  
  Site header/nav links now point Home → `/` and Become a Tutor → `/become-a-tutor`; all other legacy links were removed to prevent reaching old pages.

## 2025-12-02 — RAG Assistant Alignment

- **Course slug enforced in tutor payloads**  
  Fixed `handleSendChat` so `/assistant/query` always receives the same slug that was used during `npm run rag:ingest`. Neo4j now returns relevant chunks again and the OpenAI response is grounded in the PDF material.

- **Documentation sweep**  
  Refreshed README, `Course_Platform.md`, `CP_Arc.md`, `docs/App Changes.md`, `docs/project-structure.md`, `docs/databaseSchema.md`, and `rag/rag.md` with the ingestion command, slug requirement, and AI tutor smoke test.

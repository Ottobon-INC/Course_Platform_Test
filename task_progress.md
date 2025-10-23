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

# Course Platform Refactor & Google OAuth Walkthrough

> Friendly, end-to-end recap of everything we touched while taking the legacy project to the current state (frontend/backend split + working Google login).

---

## 1. Repository Restructure (Day 1)

- **Goal**: break the monolith into clear domains so future work stays organised.
- **Changes**
  - Moved UI code into `frontend/` (Vite + React).
  - Created `backend/` for the Express API and `docs/`, `infrastructure/`, `scripts/` for supporting assets.
  - Added root `README.md` describing the new layout and quick-start flow.
- **Why it matters**: makes it simpler to run backend/frontend separately, swap infrastructures, and deploy independently (e.g. Replit for frontend, any node host for backend).

---

## 2. Backend Foundations

### 2.1 Tech stack

| Concern | Choice | Key files |
| --- | --- | --- |
| Runtime | Node 18 + TypeScript | `backend/package.json`, `tsconfig.json` |
| Framework | Express | `backend/src/app.ts`, `backend/src/server.ts` |
| ORM | Prisma | `backend/prisma/schema.prisma`, generated client |
| Auth | JSON Web Tokens (`jsonwebtoken`) | `backend/src/utils/jwt.ts` |
| OAuth | Google OAuth2 (`google-auth-library`) | `backend/src/services/authService.ts` |
| DB | PostgreSQL (managed instance @ `34.69.63.45:5433`) | `.env`, used by Prisma |

### 2.2 Environment handling

- `.env.example` lists required settings:
  - `DATABASE_URL=postgresql://admin:ottobon123@34.69.63.45:5433/course_platform`
  - Google credentials (client id/secret, redirect URIs)
  - `FRONTEND_APP_URL`, `JWT_SECRET`, token TTLs.
- We load env vars via `dotenv` in `backend/src/config/env.ts`, validating required values and providing sensible defaults for dev/test.

### 2.3 Prisma schema

`backend/prisma/schema.prisma` mirrors the existing database tables:

- `User`, `Course`, `CartLine`, `Enrollment`, `Topic`, `TopicProgress`.
- Added `UserSession` model for refresh-token persistence.
- Maps snake_case DB columns to camelCase fields for TypeScript ergonomics (e.g. `password_hash` → `passwordHash`).

Whenever the schema changed we ran `npm run prisma:generate` so Prisma regenerated the typed client.

### 2.4 Database connectivity

- `backend/src/db/prisma.ts` creates a shared Prisma client instance.
- Helper `disconnectPrisma` is available for tests or graceful shutdown.

---

## 3. Google OAuth + JWT Sessions

### 3.1 Flow overview

1. **Frontend** calls `GET /auth/google?redirect=/dashboard`.
2. **Backend** stores a random `state` + desired redirect in short-lived cookies, then sends the user to Google’s consent screen.
3. Google redirects to `/auth/google/callback` with `code` + `state`.
4. Backend verifies `state`, exchanges the code for Google profile info, upserts the user, creates a session, and redirects to the frontend callback with signed JWT tokens.
5. Frontend stores `accessToken` + `refreshToken` in `localStorage`. All subsequent API calls send `Authorization: Bearer <accessToken>`.
6. When the access token expires, the frontend hits `/auth/refresh` with the refresh token; backend verifies it against the hashed store and issues a fresh access token.
7. Logout (`POST /auth/logout`) deletes the session row and clears local tokens.

### 3.2 Key backend files

| File | Purpose |
| --- | --- |
| `backend/src/routes/auth.ts` | Express router implementing `/auth/google`, callback, `/auth/me`, refresh, logout. Fetches full profile for header (`id`, `email`, `fullName`). |
| `backend/src/services/authService.ts` | Wraps Google OAuth client, handles code exchange, user upsert, session creation (includes refresh token hashing via `utils/hash.ts`). |
| `backend/src/middleware/requireAuth.ts` | Validates access tokens, checks session validity, populates `req.user`. |
| `backend/src/utils/jwt.ts` | Signs access + refresh tokens with configurable TTLs (`env.JWT_*`). |
| `backend/src/utils/hash.ts` | SHA-256 helper so refresh tokens are stored hashed in `user_sessions`. |

### 3.3 Session security tweaks

- Refresh tokens hashed before storage (`refreshTokenHash`).
- `/auth/me` + middleware ensure `userId` & `jwtId` align between JWT and DB row.
- Forced `User.passwordHash` to be non-null; Google accounts get a generated UUID to satisfy the DB constraint (we never use it for login).

### 3.4 Database side-effects

- On first Google login:
  - `users` row inserted/updated (`email`, `full_name`, non-null `password_hash` placeholder).
  - `user_sessions` row created with hashed refresh token, issuance time, expiry.
- Verified via pgAdmin after sign-in (you saw the records appear).

---

## 4. Frontend Integration

### 4.1 Auth utilities (`frontend/src/lib/auth.ts`)

- Handles storing tokens in `localStorage`.
- `refreshAccessToken()` posts to `/auth/refresh` when a 401 is encountered.
- `getBackendUrl()` reads `VITE_BACKEND_URL`.

### 4.2 Query client (`frontend/src/lib/queryClient.ts`)

- Wraps `fetch` to attach JWT tokens automatically.
- Retries once on 401 by refreshing tokens; clears storage if refresh fails.

### 4.3 Dashboard header (`frontend/src/pages/DashboardPage.tsx`)

- Detects auth state on load, opens Google modal when needed.
- After successful login, fetches `/auth/me` to display a profile dropdown:
  - Avatar fallback with initials.
  - Email/name preview.
  - Stubbed “View profile” / “Account settings” actions (toast placeholders).
  - Logout option wired to `/auth/logout` plus local cleanup.
- Shows skeletons while the profile loads for a polished UX.

### 4.4 Auth callback page (`frontend/src/pages/AuthCallbackPage.tsx`)

- Parses tokens from query string, saves them, then redirects to the intended page (`redirect` param set by backend).

### 4.5 Environment variables (`frontend/.env`)

- `VITE_BACKEND_URL=http://localhost:3000` during development.
- Production deploy just needs this swapped to the hosted API URL; tokens continue to flow the same way.

---

## 5. Challenges & Fixes (Chronological)

1. **Prisma & TypeScript configuration**
   - Issue: tests flagged `rootDir` mismatch because we included `tests/**/*.ts` but restricted `rootDir` to `src/`.
   - Fix: set `rootDir: "."` in `backend/tsconfig.json`, added missing type packages (`@types/cookie-parser`, etc.).

2. **Compound unique keys**
   - Issue: Prisma generated `enrollments_user_id_course_id_key`, not `userId_courseId`.
   - Fix: Updated `cart` and `enrollments` routes to use the generated compound key accessor.

3. **Refresh-token security**
   - Issue: refresh tokens were stored in plain text.
   - Fix: Introduced `utils/hash.ts` (SHA-256), updated session creation and validation to hash and compare.

4. **Google OAuth redirect mismatch**
   - Issue: Google returned 400 with `redirect_uri_mismatch`.
   - Fix: Added both `http://localhost:3000/auth/google/callback` and production `https://n8nottobon.duckdns.org/rest/oauth2-credential/callback` to the Google console; updated `.env.example`.

5. **Authentication failure after consent**
   - Issue: DB rejected upsert because `users.password_hash` is `NOT NULL`.
   - Fix: Prisma schema marks `passwordHash` as required; Google upserts now seed a random UUID placeholder.

6. **Prisma generate locking error**
   - Issue: `EPERM: rename ... query_engine-windows.dll.node` (engine locked by running dev server).
   - Fix: stop node processes (`Stop-Process -Name node`), remove `.prisma/client`, rerun `npm run prisma:generate`.

7. **Profile dropdown**
   - Challenge: surface user identity in the UI.
   - Solution: built dropdown with shadcn `DropdownMenu`, `Avatar`, `Skeleton`. Fetch `/auth/me`, show skeleton while loading, provide logout + placeholder actions.

---

## 6. Final OAuth Sign-in Checklist

1. **Environment**
   - Backend `.env` filled with Google credentials, DB URL, JWT secret.
   - Frontend `.env` pointing to backend URL.
2. **Google Cloud Console**
   - OAuth client set to “Web application”.
   - Authorized redirect URIs include:
     - `http://localhost:3000/auth/google/callback` (dev)
     - `https://n8nottobon.duckdns.org/rest/oauth2-credential/callback` (existing production proxy)
     - Future deploys (e.g., Replit) will need their own `https://<your-app>/auth/google/callback` added.
3. **Database**
   - `user_sessions` table created manually (SQL script tracked in `docs/backend-log.md`).
   - Table cleared before switching to hashed tokens.
4. **Run flow**
   - Start backend (`npm run dev`), frontend (`npm run dev`).
   - From frontend, click “Continue with Google”.
   - Confirm redirect to Google, grant consent, get redirected to `/auth/callback`.
   - Tokens stored, dashboard renders with profile dropdown, data appears in Postgres.

---

## 7. How to Reuse This Stack Elsewhere

1. **Backend copy**
   - Bring over `src/routes/auth.ts`, `src/services/authService.ts`, `src/utils/jwt.ts`, `src/utils/hash.ts`, `src/middleware/requireAuth.ts`, and Prisma schema additions (`UserSession`, required `passwordHash`).
   - Ensure `env.ts` (or equivalent) enforces Google creds + JWT settings.
   - Create database migration for `user_sessions`.

2. **Frontend integration**
   - Reuse `lib/auth.ts`, `lib/queryClient.ts` to manage tokens.
   - Add an `/auth/callback` route that stores tokens.
   - Drop in the header profile dropdown pattern (Avatar + DropdownMenu + Skeleton) or adapt to your design.

3. **Configuration**
   - Register redirect URIs for every environment (localhost, staging, prod).
   - Update `.env` files accordingly.

4. **Testing**
   - `npm run build` and `npm run test` (backend) confirm TypeScript + vitest pass.
   - Frontend `npm run build` ensures Vite compiles with browserslist warnings noted.

---

## 8. Quick Reference to Created / Modified Files

- **Backend**
  - Added: `src/services/authService.ts`, `src/utils/jwt.ts`, `src/utils/hash.ts`, `src/middleware/requireAuth.ts`, `src/db/prisma.ts`, `prisma/schema.prisma` (new `UserSession`), `.env.example` updates.
  - Modified: `src/routes/auth.ts`, `src/app.ts`, `package.json` dependencies, `tsconfig.json`, docs entries.
- **Frontend**
  - Added: `src/lib/auth.ts`, `src/pages/AuthCallbackPage.tsx`.
  - Modified: `src/pages/DashboardPage.tsx` (profile dropdown, cart, auth modal), `docs/frontend-structure.md`.
- **Docs**
  - Updated `docs/backend-log.md`, `docs/frontend-structure.md`.
  - (This summary) `docs/project-walkthrough.md`.

---

## 9. Next Steps (Optional Ideas)

- Build a dedicated profile/settings page to replace the placeholder toasts.
- Create migrations or Prisma migrate scripts for future schema changes instead of manual SQL.
- Layer tests around the auth router (supertest + vitest) and the frontend auth hook (React Testing Library).
- Prep deploy configs (Dockerfile or Replit secrets) so environment variables and redirect URIs stay consistent between dev and production.

---

Feel free to convert this Markdown to PDF/Word; everything is written for copy-paste into a doc. Ping me when you’re ready for the next milestone! 🎯


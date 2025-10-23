# Course Platform — Full Project Documentation

> Version: 2025-10-15  
> Repository layout: monorepo (frontend + backend + shared assets)

---

## Table of Contents

1. [Project Overview](#project-overview)  
2. [Repository Structure](#repository-structure)  
3. [Technology Stack](#technology-stack)  
4. [Environment & Configuration](#environment--configuration)  
5. [Backend Architecture](#backend-architecture)  
   - [Runtime & Server Bootstrap](#runtime--server-bootstrap)  
   - [API Surface](#api-surface)  
   - [Authentication Flow](#authentication-flow)  
   - [Database Schema](#database-schema)  
6. [Frontend Architecture](#frontend-architecture)  
   - [Routing & Navigation](#routing--navigation)  
   - [State Management & Data Fetching](#state-management--data-fetching)  
   - [Design System & Styling](#design-system--styling)  
   - [Major Screens](#major-screens)  
7. [Cross-Cutting Concerns](#cross-cutting-concerns)  
8. [Local Development Workflow](#local-development-workflow)  
9. [Deployment Notes](#deployment-notes)  
10. [Verification Checklist](#verification-checklist)  
11. [Future Enhancements](#future-enhancements)

---

## Project Overview

The Course Platform is a full-stack web application that delivers a LearnHub-branded experience for browsing, enrolling in, and tracking online courses. It features:

- A dashboard with hero stats, search, course catalog, enrollment widgets, and personalized sections.
- Fully authenticated user flows via Google OAuth 2.0, issuing signed JWT access/refresh tokens.
- A persistent shopping cart tied to the backend database (`cart_items` table).
- Course-specific routes for learning, enrollment, and assessments.
- Responsive, theme-aware UI built with Tailwind CSS, Radix UI primitives, and shadcn-style components.
- Type-safe configuration, validation, and database access using Zod + Prisma.

The codebase is intentionally structured so another engineer (or an LLM agent) can reconstruct the entire app—including UI/UX, styling, routing, backend APIs, and database schema—from this documentation.

---

## Repository Structure

| Path | Description |
| --- | --- |
| `frontend/` | Vite + React SPA, Tailwind styling, component library, route pages. |
| `backend/` | Express API written in TypeScript, Prisma ORM, Google OAuth, cart/session services. |
| `shared/` | Shared TypeScript utilities and assets consumed by the frontend. |
| `infrastructure/` | Deployment scripts/placeholders (na). |
| `scripts/` | Auxiliary automation (currently empty scaffolding). |
| `.replit`, `replit.nix` | Replit-specific run configuration (optional). |
| `task_progress.md` | Running changelog of all implemented features. |

---

## Technology Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend runtime | React 18 + TypeScript | `frontend/src/main.tsx`, `frontend/src/App.tsx`. |
| Frontend tooling | Vite 5, vite-plugin-react, Vite Replit plugins | `frontend/vite.config.ts`. |
| UI foundation | Tailwind CSS 3, shadcn-like components (Radix UI headless primitives) | `frontend/index.css`, `frontend/src/components/ui/*`. |
| Routing | `wouter` | Lightweight SPA router. |
| State/Data | React Query (`@tanstack/react-query`), React Hook Form, Zod | Query client defined in `frontend/src/lib/queryClient.ts`. |
| Animations | Framer Motion, Embla carousel, custom CSS keyframes | Example: `frontend/index.css`. |
| Icons | Lucide-react, react-icons | See `frontend/package.json`. |
| Backend runtime | Node.js 20+, Express 4, TypeScript | Entry `backend/src/server.ts`. |
| Backend tooling | tsx (hot reload), tsc (build), Vitest (tests) | See `backend/package.json`. |
| Auth | Google OAuth 2.0 (`google-auth-library`), JWT (`jsonwebtoken`), secure cookies | Flow defined in `backend/src/routes/auth.ts`. |
| ORM & DB | Prisma 6, PostgreSQL | Schema `backend/prisma/schema.prisma`, DB URL via `DATABASE_URL`. |
| Config validation | dotenv + Zod | `backend/src/config/env.ts`. |
| Testing | Vitest + Supertest scaffolding (no tests yet). |
| Hosting | Designed for Replit; portable to Render/Fly/Heroku (Express + Postgres). |

---

## Environment & Configuration

### Prerequisites
- Node.js >= 20
- pnpm or npm (repo uses npm scripts)
- PostgreSQL instance with the ability to create UUID columns (uses `gen_random_uuid()`).
- Google Cloud project with OAuth 2.0 credentials.

### Environment Variables

All backend variables validated in `backend/src/config/env.ts`.

| Variable | Local Example | Purpose / Used By |
| --- | --- | --- |
| `NODE_ENV` | `development` | Enables dev defaults. |
| `PORT` | `4000` | Express listen port (`server.ts`). |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | Prisma datasource. |
| `GOOGLE_CLIENT_ID` | (from Google console) | OAuth client. |
| `GOOGLE_CLIENT_SECRET` | (secret) | OAuth client. |
| `GOOGLE_REDIRECT_URI` | `http://localhost:4000/auth/google/callback` | OAuth redirect. |
| `JWT_SECRET` | 32+ char string | Signs access tokens. |
| `JWT_REFRESH_SECRET` | 32+ char string | Signs refresh tokens. |
| `JWT_ACCESS_TOKEN_TTL_SECONDS` | `900` | Access token TTL. |
| `JWT_REFRESH_TOKEN_TTL_DAYS` | `30` | Refresh token TTL. |
- **CORS**: Configured to allow credentials from every origin listed in  `FRONTEND_APP_URLS`. 
| `GOOGLE_STATE_COOKIE_NAME` | `cp_oauth_state` | Name for CSRF state cookie. |
| `GOOGLE_STATE_MAX_AGE_SECONDS` | `600` | Cookie TTL. |

Frontend expects `VITE_API_BASE_URL` pointing to the backend (`http://localhost:4000` in dev) plus any analytics keys if needed.

---

## Backend Architecture

### Runtime & Server Bootstrap

- Entry point `backend/src/server.ts` imports `createApp()` and `env`, then calls `app.listen(env.port)`.
- `backend/src/app.ts` constructs an Express app with CORS configured to allow `env.frontendAppUrls`, JSON parsing, cookie parser, and registers routers:
  - `GET /` health message (JSON).
  - `GET /health` additional checks (see `routes/health.ts`).
  - `authRouter` on `/auth`.
  - `usersRouter` on `/users`.
  - `cartRouter` on `/cart`.
- Global error handler logs and returns a 500 JSON error.

### API Surface

| Method | Path | Handler | Description |
| --- | --- | --- | --- |
| `GET` | `/` | Inline | Returns `{message: "Course Platform API"}`. |
| `GET` | `/health` | `healthRouter` | Basic up-check (not shown but simple). |
| `GET` | `/auth/google` | `authRouter` | Initiates Google OAuth, sets state cookie, redirects to Google. |
| `GET` | `/auth/google/callback` | `authRouter` | Exchanges code for tokens, creates user/session, redirects to SPA with query params. |
| `POST` | `/auth/google/exchange` | `authRouter` | Programmatic code exchange; returns session JSON. |
| `POST` | `/auth/google/id-token` | `authRouter` | Verifies Google ID token for one-tap flows. |
| `POST` | `/auth/refresh` | `authRouter` | Exchanges refresh token for new session tokens. |
| `POST` | `/auth/logout` | `authRouter` | Revokes refresh token + session. |
| `GET` | `/users/me` | `usersRouter` | Requires Bearer access token; returns profile. |
| `GET` | `/cart` | `cartRouter` | Requires auth; returns array of cart items. |
| `POST` | `/cart` | `cartRouter` | Adds or updates a course in the cart. |
| `DELETE` | `/cart/items/:courseSlug` | `cartRouter` | Removes course from cart. |
| `DELETE` | `/cart` | `cartRouter` | Clears entire cart. |

All authenticated routes use `requireAuth` (`backend/src/middleware/requireAuth.ts`) which verifies Bearer access tokens issued by the session service.

### Authentication Flow

1. SPA triggers `/auth/google?redirect=/post-login-url` (e.g., Dashboard).
2. Backend sets a signed state cookie (with optional redirect) and redirects to Google.
3. Google returns to `/auth/google/callback` with `code` + `state`.
4. Backend validates state, exchanges code for tokens via `exchangeCodeForTokens`.
5. `findOrCreateUserFromGoogle` ensures the user exists in DB.
6. `createSession` issues access + refresh tokens; refresh hash stored in `user_sessions`.
7. Backend redirects the browser to `${FRONTEND_APP_URLS[0]}/auth/callback` (the first configured origin) with tokens in query params.
8. Frontend handles callback in `frontend/src/pages/AuthCallbackPage.tsx`, persisting `session`, `user`, and `isAuthenticated` in localStorage.

Refresh tokens are hashed in the database (`sessionService.ts`). Access tokens are short-lived and verified via `verifyAccessToken`.

### Database Schema

Defined in `backend/prisma/schema.prisma`. Key models:

- **User**: `user_id` UUID primary key, unique email & phone, `full_name`, `password_hash` (placeholder for future password auth). Relations to cart, enrollments, progress, sessions.
- **Course**: Static metadata plus relations to cart lines and topics.
- **CartItem**: Unique per `(user_id, course_slug)` with title, price, optional metadata JSON.
- **CartLine**: Future checkout pipeline (course_id referencing `Course`).
- **Enrollment**: Unique `(user_id, course_id)` entries with status, payment details.
- **Topic / TopicProgress**: Content structure for lessons and user progress tracking.
- **UserSession**: Stores hashed refresh tokens, JWT IDs, expiry.

Prisma client is generated via `npx prisma generate`. Queries use the typed client in service files (`sessionService.ts`, `cartService.ts`, `userService.ts`).

---

## Frontend Architecture

### Tooling & Bootstrapping

- Vite entry `frontend/src/main.tsx` mounts the SPA using React 18 concurrent root.
- `frontend/vite.config.ts`:
  - Adds `@` alias → `frontend/src`.
  - Adds `@shared` alias → `shared/`.
  - Registers Replit runtime-error overlay in development.
  - Cartographer plugin (analytics/telemetry for Replit) loaded conditionally.

### Routing & Navigation

`frontend/src/App.tsx` defines the router with Wouter:

| Route | Component | Purpose |
| --- | --- | --- |
| `/dashboard` (default) | `DashboardPage` | Main landing view once authenticated. |
| `/cart` | `CartPage` | Manages shopping cart items and checkout CTA. |
| `/course/:id/learn/:lesson` | `CoursePlayerPage` | Lesson viewer with progress. |
| `/course/:id/enroll` | `EnrollmentPage` | Enrollment steps & payment stub. |
| `/course/:id/assessment` | `AssessmentPage` | Quizzes/assessments. |
| `/auth/callback` | `AuthCallbackPage` | Handles Google OAuth redirect; stores session; navigates to redirect path. |
| Any other | `NotFound` | 404 page. |

`QueryClientProvider` (Tanstack Query) wraps the router, enabling server state caching and the toast system (`frontend/src/hooks/use-toast.ts` + `<Toaster />`).

### State Management & Data Fetching

- **Local storage**: `isAuthenticated`, `user`, and `session` persisted for login state.
- **React Query**: ready for server data (currently minimal usage).
- `frontend/src/lib/api.ts` normalizes the REST base URL (`VITE_API_BASE_URL`) so every network request hits the configured backend domain.
- **Custom hooks**: `useToast` provides a global toast queue.
- **Cart state**: 
  - On dashboard load, `fetchCart` (in `DashboardPage.tsx`) fetches `/cart` and hydrates UI.
  - Add/remove operations call backend endpoints and update `cart` state.
  - Cart count badge reads from this state.

### Design System & Styling

- Tailwind CSS base defined in `frontend/src/index.css` with CSS variables for light/dark palettes, gradient tokens, typography, elevations, and animations (e.g., `fadeInUp`, `pulse-glow`).
- Theme toggling implemented by `ThemeToggle` component (uses `next-themes`).
- UI components (buttons, dialogs, cards, tabs, toasts, dropdowns) follow shadcn patterns under `frontend/src/components/ui/`.
- Color tokens include course-category gradients:
  - AI & ML: `--gradient-ai-ml-from` / `to`
  - Frontend: `--gradient-frontend-from` / `to`
  - Python: `--gradient-python-from` / `to`
  - JavaScript: `--gradient-javascript-from` / `to`
  - DevOps: `--gradient-devops-from` / `to`
- Animations, gradient hover effects, and card scaling classes defined in CSS for reusability.

### Major Screens

1. **Dashboard (`frontend/src/pages/DashboardPage.tsx`)**
   - Displays welcome hero, skill meter, search input with animated placeholder (typing/deleting effect).
   - Static course seed data with categories, ratings, durations, price; gradient backgrounds via Tailwind.
   - Supports adding courses to cart (calls backend), continuing courses, showing modals for details.
   - Includes theme toggle, cart badge, authenticated profile dropdown with avatar and menu (Profile, Settings, Logout).
   - Handles OAuth login triggers, local storage of login state, and redirect to OAuth endpoint.

2. **Cart (`frontend/src/pages/CartPage.tsx`)**
   - Renders cart items with metadata, discounts (bundle 20%), order summary, total calculations.
   - Buttons for checkout, enroll single, remove, clear.
   - Uses toasts to communicate results.

3. **Auth Callback (`frontend/src/pages/AuthCallbackPage.tsx`)**
   - Reads query parameters (`accessToken`, `refreshToken`, user info).
   - Validates presence, persists to storage, sets redirect path or shows error toast.
   - Shows spinner while processing.

4. **Course Player / Enrollment / Assessment**
   - Provide skeleton flows for actual course content, supporting future expansions.

5. **Not Found**
   - Simple fallback with CTA to return to dashboard.

Shared utilities (e.g., `frontend/src/lib/format.ts`) can be added as needed for consistent formatting.

---

## Cross-Cutting Concerns

- **CORS**: Configured to allow credentials from every origin listed in `FRONTEND_APP_URLS`.
- **Cookies**: Only Google OAuth state cookie currently used; un-samesite to allow external redirect.
- **JWT Handling**: Access token expected in `Authorization: Bearer <token>` header. Refresh token only stored client-side and used via API endpoints.
- **Error Handling**: Global Express error middleware logs and returns JSON. Frontend toasts surface meaningful messages.
- **Security**: Refresh token hashes stored with SHA-256; session mismatch detection.
- **Analytics**: Not yet integrated (space left for future Replit cartographer data).

---

## Local Development Workflow

```bash
# 1. Install dependencies
npm --prefix backend install
npm --prefix frontend install

# 2. Set environment variables
cp backend/.env.example backend/.env   # fill in secrets
cp frontend/.env.example frontend/.env # set VITE_API_BASE_URL=http://localhost:4000

# 3. Generate Prisma client & apply schema
cd backend
npx prisma generate
npx prisma migrate dev --name init

# 4. Run backend (port 4000 by default)
   (Optional) To share your local backend over HTTPS, open a new terminal and run  `ssh -R 80:localhost:4000 serveo.net`. Use the printed `https://�serveo.net` URL for `VITE_API_BASE_URL`, `FRONTEND_APP_URLS`, and `GOOGLE_REDIRECT_URI`. 
npm run dev

# 5. In a second terminal, run frontend (port 5173)
cd ../frontend
npm run dev

# 6. Open http://localhost:5173, login via Google, interact with dashboard/cart.
```

### Directory-specific scripts

| Location | Command | Description |
| --- | --- | --- |
| `backend` | `npm run dev` | Hot-reload server via `tsx`. |
|  | `npm run build` | Compile to `dist/` using `tsc`. |
|  | `npm run start` | Run compiled server. |
|  | `npm run test` | Placeholder (Vitest). |
| `frontend` | `npm run dev` | Vite dev server. |
|  | `npm run build` | Production build to `dist/`. |
|  | `npm run preview` | Preview production output. |

---

## Deployment Notes

1. **Backend**
   - Deploy to any Node-compatible host (Render, Railway, Fly.io).
   - Ensure `PORT` environment variable is consumed (Express already reads `env.port`).
   - Provide `DATABASE_URL`, Google secrets, JWT secrets.
   - Run `npx prisma migrate deploy` before start.

2. **Frontend**
   - Build with `npm run build`; deploy `frontend/dist` to static hosting (Vercel, Netlify).
   - Set `VITE_API_BASE_URL` (and any additional config) via host-specific env.
   - OAuth redirect URI must point to backend domain (`https://api.example.com/auth/google/callback`) and SPA callback (`https://app.example.com/auth/callback`).

3. **Replit Option**
   - Not recommended for both layers simultaneously unless customizing `.replit` run command and env mapping.
   - If used, front backend via external domain and set environment secrets accordingly.

---

## Verification Checklist

1. **Backend startup**  
   - `npm run dev` logs `API ready on http://localhost:4000` and database host.
2. **Prisma connectivity**  
   - `npx prisma studio` lists tables (`users`, `cart_items`, etc.).
3. **Frontend dev server**  
   - `npm run dev` (frontend) outputs `Local: http://localhost:5173/`.
4. **Login flow**  
   - Visiting `/dashboard` unauthenticated prompts Google login; after completing, toast indicates success and user avatar appears.
5. **Cart operations**  
   - Clicking `+` or `Add to Cart` toasts “Added to Cart”; `/cart` shows items; DB `cart_items` contains row with matching `user_id/course_slug`.
6. **Remove / Clear**  
   - Removing a course triggers success toast and DB row deletion.
7. **Protected route**  
   - `GET http://localhost:4000/users/me` with Bearer token returns JSON profile.
8. **Logout**  
   - Dropdown `Logout` triggers success toast; local storage cleared; `users/me` subsequently 401.

---

## Future Enhancements

- Integrate actual checkout/payment API and enrollments (currently placeholders).
- Add automated tests (Vitest + Supertest backend, React Testing Library frontend).
- Implement real-time progress sync for course player.
- Configure CI/CD for automatic deployment (GitHub Actions).
- Optional: Replace static course data with backend-managed catalog.

---

This documentation intentionally captures every pertinent detail—architecture, configuration, routes, styling tokens, and workflows—so another engineer or AI assistant can recreate an identical Course Platform instance from scratch.




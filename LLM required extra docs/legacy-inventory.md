# Legacy / Unwired Inventory

This file lists components, routes, and configs that exist in the repo but are **not wired** in runtime based on `frontend/src/App.tsx` and `backend/src/app.ts`.

## 1) Frontend pages NOT routed
These files exist under `frontend/src/pages` but are not referenced in `App.tsx`:
- `AuthPage.tsx`
- `TutorLoginPage.tsx`
- `CoursesPage.tsx`
- `DashboardPage.tsx`
- `CartPage.tsx`
- `AboutPage.tsx`

Legacy-but-routed pages:
- `EnrollmentPage.tsx` and `AssessmentPage.tsx` are routed but considered legacy flow.

## 2) Backend routes NOT mounted
All active route files in `backend/src/routes` are mounted in `backend/src/app.ts`.

Unused/legacy route files:
- `backend/src/routes/lessons.ts.bak` (not imported)

## 3) Env variables that can drift
- `VITE_API_URL` (used only in Navbar OAuth redirect)
- `VITE_API_BASE_URL` (used by API helper)

These should be kept aligned to avoid inconsistent routing.

## 4) Data paths not enforced by Prisma
Tables used by quizzes (`quiz_*`, `module_progress`) are not in Prisma schema; they must exist manually.

## Addendum - 2026-03-04 (No Previous Lines Removed)
- Verified current runtime architecture: one `frontend/` app and one `backend/` API in this repository.
- Verified async AI flow: request -> `background_jobs` queue -> `aiWorker` processing -> SSE response stream.
- Verified cohort access-state source endpoint: `GET /courses/:courseKey/access-status` returning `isAuthenticated`, `hasApplied`, `isApprovedMember`.
- Verified registration identity linkage: `POST /registrations` normalizes email and resolves/writes `registrations.user_id` using auth-user match or `users.email` lookup.
- Verified course details CTA progression for cohort flow: `Register Now` -> `Apply for Cohort` -> `Application is under review` -> `Start Learning`.


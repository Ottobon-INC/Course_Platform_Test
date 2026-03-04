# CP_Frontend

React + Vite frontend for Course_Platform_Test.

## Quick start
```bash
cd frontend
npm install
npm run dev
```

## Env
- `VITE_API_BASE_URL` (default `http://localhost:4000`) used by `buildApiUrl`.

## Notes
- The marketing navbar OAuth flow uses `VITE_API_URL` in `src/App.tsx`; keep it aligned with `VITE_API_BASE_URL`.

## Addendum - 2026-03-04 (No Previous Lines Removed)
- Verified current runtime architecture: one `frontend/` app and one `backend/` API in this repository.
- Verified async AI flow: request -> `background_jobs` queue -> `aiWorker` processing -> SSE response stream.
- Verified cohort access-state source endpoint: `GET /courses/:courseKey/access-status` returning `isAuthenticated`, `hasApplied`, `isApprovedMember`.
- Verified registration identity linkage: `POST /registrations` normalizes email and resolves/writes `registrations.user_id` using auth-user match or `users.email` lookup.
- Verified course details CTA progression for cohort flow: `Register Now` -> `Apply for Cohort` -> `Application is under review` -> `Start Learning`.


# Tutor Dashboard Spec (Frontend + Backend)

Source of truth: `frontend/src/pages/TutorDashboardPage.tsx` and `backend/src/routes/tutors.ts`.

## 1) Access and permissions
- Frontend route: `/tutors` (requires session with role `tutor` in UI logic).
- Backend endpoints require:
  - `requireAuth`
  - `requireTutor` (role **must** be `tutor`; admin tokens will fail these routes).
  - Course assignment check via `course_tutors`.

## 2) Core features (UI)
1) **Course selector**
   - Data source: `GET /tutors/me/courses`
   - Response: `{ courses: [{ courseId, slug, title, description, role }] }`

2) **Enrollment roster**
   - Data source: `GET /tutors/:courseId/enrollments`
   - Response: `{ enrollments: [{ enrollmentId, enrolledAt, status, userId, fullName, email }] }`

3) **Progress table**
   - Data source: `GET /tutors/:courseId/progress`
   - Response: `{ learners: [{ userId, fullName, email, enrolledAt, completedModules, totalModules, percent }], totalModules }`

4) **Telemetry monitor (status badges)**
   - Data source: `GET /activity/courses/:courseId/learners`
   - Response: `{ learners, summary }` where `summary` has `engaged`, `attention_drift`, `content_friction`, `unknown`.
   - Auto refresh: every 30s.

5) **Learner timeline**
   - Data source: `GET /activity/learners/:learnerId/history?courseId=...&limit=40`
   - Combines `enrollments` and `progress` for user display details.

6) **Tutor copilot chat**
   - Data source: `POST /tutors/assistant/query` with `{ courseId, question }`.
   - Uses course snapshot + OpenAI to generate 3-5 sentence response.

## 3) Copilot prompt content
`/tutors/assistant/query` uses `buildTutorCourseSnapshot()`:
- Stats: total enrollments, new this week, average completion, active this week, at-risk count (<50% completion).
- Learner roster (top 40) with completion + last activity.

## 4) Known limitations
- Admin users cannot access `/tutors/*` routes due to strict `requireTutor` checks.
- Tutor dashboard assumes courses are already assigned in `course_tutors`.

## Addendum - 2026-03-04 (No Previous Lines Removed)
- Verified current runtime architecture: one `frontend/` app and one `backend/` API in this repository.
- Verified async AI flow: request -> `background_jobs` queue -> `aiWorker` processing -> SSE response stream.
- Verified cohort access-state source endpoint: `GET /courses/:courseKey/access-status` returning `isAuthenticated`, `hasApplied`, `isApprovedMember`.
- Verified registration identity linkage: `POST /registrations` normalizes email and resolves/writes `registrations.user_id` using auth-user match or `users.email` lookup.
- Verified course details CTA progression for cohort flow: `Register Now` -> `Apply for Cohort` -> `Application is under review` -> `Start Learning`.


# Course Platform Walkthrough – From Landing to Certificate

This walkthrough pairs code references with UX steps so another engineer (or an LLM agent) can reproduce the entire learner journey without opening the rest of the repo.

## 1. Sign-in flow
1. Learner clicks "Continue with Google" on the landing page (`frontend/src/pages/LandingPage.tsx`).
2. Browser is redirected to `/auth/google` (`backend/src/routes/auth.ts`) where a signed state cookie is set and the user is sent to Google OAuth.
3. Google returns to `/auth/google/callback`; the backend exchanges the code, upserts the user (`services/userService.ts`), creates JWT access/refresh tokens (`services/sessionService.ts`), stores the hashed refresh token in `user_sessions`, and redirects to `/auth/callback` with the tokens and redirect path.
4. `AuthCallbackPage.tsx` stores the session via `writeStoredSession`, displays success/error toasts, and forwards the learner to their intended route (defaults to the featured course).

## 2. Enrollment + MetaLearn protocol
1. Visiting `/course/ai-in-web-development` loads `CourseDetailsPage.tsx`, which fetches `/courses/:slug` and `/lessons/courses/:slug/topics` to render live curriculum data.
2. Clicking "Enroll Now" first calls `POST /courses/:slug/enroll?checkOnly=true` to validate cohort eligibility. Non-cohort emails get a friendly toast and the modal stays closed.
3. Eligible learners see the MetaLearn modal. Accepting it triggers `enrollLearner()` -> `POST /courses/:slug/enroll` (with Authorization header). The backend resolves slug/UUID/name, upserts an `enrollments` row via `ensureEnrollment`, and returns `{ status: "enrolled" }`.
4. After enrollment, the page fetches `/lessons/courses/:slug/personalization`; if `hasPreference` is false the learner is redirected to `/course/:slug/path` so the study-style questionnaire runs before unlocking the player.

## 3. Study persona questionnaire
1. `CoursePlayerPage.tsx` maintains persona state (`studyPersona`, `lockedPersona`, `personaPending`, etc.) and loads any saved preference from `/lessons/courses/:slug/personalization` (auth required).
2. Learners who never answered the survey see the three-question dialog (`personaSurveyQuestions`). Selecting answers enables "See my study style" which runs the same logic as enrollment and surfaces the recommended persona.
3. Clicking "Use this style" posts `{ persona }` back to `/lessons/courses/:slug/personalization`. The backend upserts `topic_personalization` via Prisma's `upsert` with the `(userId, courseId)` unique key.
4. Learners who previously picked a persona keep it cached locally (`personaHistoryKey`) so toggling between Standard/personalized is instant even after logging out and back in.

## 4. Course player navigation
1. `GET /lessons/courses/:slug/topics` streams every topic sorted by moduleNo/topicNumber. The response includes persona guide fields, PPT URLs, video URLs (already normalized), and simulation metadata.
2. `CoursePlayerPage.tsx` groups the topics into introduction + numbered modules, builds `sidebarModules`, and renders `CourseSidebar.tsx` with search, completion toggles, and per-module lock badges.
3. When a lesson becomes active, the page calls `GET /lessons/:lessonId/progress` to hydrate status; marking a lesson complete triggers `PUT /lessons/:lessonId/progress` with `{ progress, status }`.
4. Lesson content is shown via `LessonTabs.tsx` which renders persona-specific Markdown plus practice blocks and resources.

## 5. Quiz cadence
1. Opening the Quiz tab fetches `/quiz/sections/:slug` and `/quiz/progress/:slug`. The response lists each module/topic pair, whether it is unlocked, last attempt status, and module-level cooldown or dependency reasons.
2. Starting a quiz posts to `/quiz/attempts` with `{ courseId, moduleNo, topicPairIndex }`. Backend resolves the slug, ensures the learner exists, selects a random question set, stores it in `quiz_attempts`, and returns the frozen questions (options without `isCorrect`).
3. Submitting answers hits `/quiz/attempts/:attemptId/submit`. The backend compares each `{ questionId, optionId }`, calculates `scorePercent`, updates the attempt row, and if the last topic pair of a module passed, updates `module_progress` to mark the module as completed.
4. The frontend refreshes `sections`/`progress` so the sidebar and quiz cards immediately reflect unlocked modules.

## 6. Tutor chat and prompt governance
1. The chat dock fetches curated prompts via `/lessons/courses/:slug/prompts`. Suggestions are grouped via `parentSuggestionId`, enabling multi-step follow-ups (Q -> more specific subquestions).
2. Typed prompts post to `/assistant/query` with `{ courseId: slug, moduleNo, question }` plus Authorization. The backend:
   - Validates prompt quota using `module_prompt_usage`.
   - Enforces per-user rate limits via `assertWithinRagRateLimit`.
   - Scrubs PII (`rag/pii.ts`), embeds the question (OpenAI), fetches top contexts from Postgres pgvector, and calls `generateAnswerFromContext()`.
   - Logs usage with `rag/usageLogger.ts` and returns `{ answer, nextSuggestions }`.
3. Suggestions with stored answers bypass OpenAI: the backend simply returns the curated answer plus child suggestions.
4. If a learner exhausts the typed quota for a module, the API responds with HTTP 429 and a friendly message instructing them to continue to the next module.

## 7. Certificate preview
1. When quizzes report all modules passed, the player links to `/course/:slug/certificate` (`CourseCertificatePage.tsx`).
2. The page shows the blurred certificate, planned pricing (Razorpay placeholder), and a back-to-course button. Real payment logic can hook into the stubbed `handlePayment` implementation.

## 8. Troubleshooting & Verification
- **OAuth** – confirm Google Cloud console has both backend and SPA redirect URIs. Missing values yield `redirect_uri_mismatch` errors before the app boots.
- **Personalization** – unauthorized responses from `/lessons/courses/:slug/personalization` indicate the learner is not signed in; ensure the session heartbeat refreshed tokens before hitting the endpoint.
- **Tutor quotas** – HTTP 429 from `/assistant/query` means the learner hit the typed quota for the module. Quotas reset automatically when the next module unlocks.
- **Ingestion** – run `npm run rag:ingest <pdf> <slug> "<Course Title>"` whenever the course PDF changes to keep `course_chunks` aligned with `course.slug`.
- **Import** – run `npm run rag:import <json>` when reusing embeddings exported from another store.

Following these steps reproduces the entire learner journey—from first visit to certificate unlock—using the current codebase.

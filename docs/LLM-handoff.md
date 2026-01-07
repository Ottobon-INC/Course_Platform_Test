# Handoff Pack - Course_Platform_Test

This document is the entry point for a Gemini (or any LLM) thread that needs a complete mental model of the Course Platform codebase using documentation only.

## 1) Recommended reading order
1. `README.md`
2. `Course_Platform.md`
3. `CP_Arc.md`
4. `Frontend.md`
5. `docs/project-structure.md`
6. `docs/databaseSchema.md`
7. `docs/project-walkthrough.md`
8. `docs/App Changes.md`
9. `docs/backend-dev-log.md`
10. `task_progress.md`
11. `frontend/README.md` and `backend/README.md`
12. `docs/design_guidelines.md`

## 2) Canonical identifiers and invariants
- Primary course name: AI Native FullStack Developer.
- Primary course slug: `ai-native-fullstack-developer`.
- Legacy slug: `ai-in-web-development` still resolves via backend slug/name resolution.
- RAG source PDF: `AI Native Full Stack Developer.pdf` (used by `npm run rag:ingest`).
- Frontend dev URL: `http://localhost:5173`.
- Backend dev URL: `http://localhost:4000` (API mounted at `/` and `/api`).

## 3) Core routes and pages
Frontend routes (see `frontend/src/App.tsx`):
- `/` - LandingPage
- `/course/:slug` - CourseDetailsPage
- `/course/:slug/learn/:topic` - CoursePlayerPage
- `/course/:slug/path` - study persona questionnaire
- `/course/:slug/certificate` - CourseCertificatePage
- `/auth/callback` - AuthCallbackPage
- `/become-a-tutor` - BecomeTutorPage

Backend routes (see `backend/src/routes`):
- `/auth/*` - OAuth + JWT lifecycle
- `/courses/*` - catalog, enrollment, cohort access checks
- `/lessons/*` - topics, progress, personalization, prompt suggestions
- `/quiz/*` - questions, attempts, grading, module gating
- `/assistant/*` - AI tutor with RAG + memory
- `/cold-call/*` - cold calling prompts, messages, stars
- `/activity/*` - learner telemetry ingestion and tutor summaries
- `/cart`, `/pages`, `/tutor-applications`, `/users`, `/health` - supporting flows

## 4) Feature to file map (frontend -> backend -> tables)
- Enrollment gating
  - Frontend: `frontend/src/pages/CourseDetailsPage.tsx`
  - Backend: `backend/src/routes/courses.ts`, `backend/src/services/cohortAccess.ts`
  - Tables: `cohorts`, `cohort_members`, `enrollments`
- Study personas
  - Frontend: `frontend/src/pages/CoursePlayerPage.tsx`
  - Backend: `backend/src/routes/lessons.ts`
  - Tables: `topic_personalization`
- Cold calling
  - Frontend: `frontend/src/components/ColdCalling.tsx`
  - Backend: `backend/src/routes/coldCall.ts`
  - Tables: `cold_call_prompts`, `cold_call_messages`, `cold_call_stars`
- Quiz gating
  - Frontend: `frontend/src/pages/CoursePlayerPage.tsx` + quiz components
  - Backend: `backend/src/routes/quiz.ts`
  - Tables: `quiz_questions`, `quiz_options`, `quiz_attempts`, `module_progress`
- AI tutor (RAG)
  - Frontend: `frontend/src/components/ChatBot.tsx`, `frontend/src/pages/CoursePlayerPage.tsx`
  - Backend: `backend/src/routes/assistant.ts`, `backend/src/rag/*`
  - Tables: `course_chunks`, `cp_rag_chat_sessions`, `cp_rag_chat_messages`, `module_prompt_usage`
- Learner telemetry + tutor monitor
  - Frontend: `frontend/src/utils/telemetry.ts`
  - Backend: `backend/src/routes/activity.ts`
  - Tables: `learner_activity_events`

## 5) Data model focus
Use `docs/databaseSchema.md` for the full ERD. The tables that drive the learner experience are:
- `courses`, `topics`, `topic_progress`, `module_progress`
- `topic_personalization`, `topic_prompt_suggestions`, `module_prompt_usage`
- `course_chunks` (pgvector embeddings)
- `cp_rag_chat_sessions`, `cp_rag_chat_messages`
- `cohorts`, `cohort_members`
- `cold_call_prompts`, `cold_call_messages`, `cold_call_stars`
- `quiz_questions`, `quiz_options`, `quiz_attempts`
- `enrollments`, `cart_items`, `page_content`

## 6) RAG ingestion and imports
- Ingest the canonical PDF into pgvector:
  - `cd backend`
  - `npm run rag:ingest "../AI Native Full Stack Developer.pdf" ai-native-fullstack-developer "AI Native FullStack Developer"`
- If embeddings are precomputed, import from JSON with:
  - `npm run rag:import <json>`

## 7) Important resolution rules
- Backend course resolution accepts:
  - UUIDs
  - Legacy slug aliases
  - Human-readable names derived from the slug (hyphens -> spaces)
- The tutor chat requires `{ courseId, topicId, moduleNo, question }` and uses
  - last N messages + rolling summary
  - follow-up rewrite step for ambiguous questions

## 8) Tutor dashboard status
Tutor flows are active and documented as current functionality, not placeholders. See:
- `Frontend.md` for the Tutor Dashboard UI
- `docs/App Changes.md` and `docs/backend-dev-log.md` for the supporting backend work

If you need a deeper dive into any area, start with the doc for that layer and then follow the file paths listed above.

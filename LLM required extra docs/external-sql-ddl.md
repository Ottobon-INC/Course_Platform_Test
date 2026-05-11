# External SQL DDL (Quiz + Module Progress)

These tables are **not defined in Prisma schema**, but are required by the quiz engine and module gating.
The SQL below reflects the columns used by `backend/src/routes/quiz.ts`.

> Note: adjust `uuid` extensions as needed (Supabase uses `gen_random_uuid()` by default).

---

## quiz_questions
```sql
CREATE TABLE IF NOT EXISTS quiz_questions (
  question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  module_no INTEGER NOT NULL,
  topic_pair_index INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  order_index INTEGER
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_course_module_pair
  ON quiz_questions (course_id, module_no, topic_pair_index);
```

## quiz_options
```sql
CREATE TABLE IF NOT EXISTS quiz_options (
  option_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(question_id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_quiz_options_question
  ON quiz_options (question_id);
```

## quiz_attempts
```sql
CREATE TABLE IF NOT EXISTS quiz_attempts (
  attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  module_no INTEGER NOT NULL,
  topic_pair_index INTEGER NOT NULL,
  question_set JSONB NOT NULL,
  answers JSONB,
  score INTEGER,
  status TEXT,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_course_user
  ON quiz_attempts (course_id, user_id);
```

## module_progress
```sql
CREATE TABLE IF NOT EXISTS module_progress (
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  module_no INTEGER NOT NULL,
  videos_completed JSONB DEFAULT '[]'::jsonb,
  quiz_passed BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cooldown_until TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  passed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id, module_no)
);

CREATE INDEX IF NOT EXISTS idx_module_progress_course
  ON module_progress (course_id, module_no);
```

---

## Provisioning notes
- These tables are currently created manually in Supabase SQL (outside Prisma migrations).
- The app uses raw SQL queries for these tables in `backend/src/routes/quiz.ts`.

## Addendum - 2026-03-04 (No Previous Lines Removed)
- Verified current runtime architecture: one `frontend/` app and one `backend/` API in this repository.
- Verified async AI flow: request -> `background_jobs` queue -> `aiWorker` processing -> SSE response stream.
- Verified cohort access-state source endpoint: `GET /courses/:courseKey/access-status` returning `isAuthenticated`, `hasApplied`, `isApprovedMember`.
- Verified registration identity linkage: `POST /registrations` normalizes email and resolves/writes `registrations.user_id` using auth-user match or `users.email` lookup.
- Verified course details CTA progression for cohort flow: `Register Now` -> `Apply for Cohort` -> `Application is under review` -> `Start Learning`.


---

## Codebase Sync Addendum (2026-05-11)

This document has been synchronized with the current implementation state of the Course Platform codebase.
If any older section in this file conflicts with this addendum, treat this addendum as the latest behavior.

### Current implementation truths

1. API surface is exposed both at root routes and mirrored `/api/*` routes in the backend app bootstrap.
2. Assessment engine is `assessment_id`-centric:
   - Live assessment definitions are in `course_assessments`.
   - Topic/module assessment pointers are resolved from `topic_content_assets.payload.assessment_id`.
   - Attempt tracking uses `quiz_attempts.assessment_id` as canonical identity (legacy `topic_pair_index` is retained for compatibility paths).
3. Course Player Page supports topic-inline quiz rendering (`Topic Assessment`) when a quiz block exists in topic block JSON and its `contentKey` resolves to a quiz asset pointer.
4. Module-level assessment flow is resolved from module/topic-linked quiz pointers and assessment definitions; latest attempt status is derived per assessment.
5. Student Dashboard assignment flow is API-driven (`/api/assignments/learner`, `/api/assignments/upload`, `/api/assignments/submit`) and filtered by learner enrollments/cohort access.
6. Persona implementation is mixed by design in current code:
   - Backend persona services and tutoring prompts use five keys: `non_it_migrant`, `rote_memorizer`, `english_hesitant`, `last_minute_panic`, `pseudo_coder`.
   - A separate learner-path questionnaire flow still contains legacy persona labels (`sports`, `cooking`, `adventure`, `normal`) and should be treated as an independent path unless migrated.
7. Content loading supports both structured block JSON and legacy plain-text topic payloads; rendering/queries must account for both shapes.

### Operational documentation rule

When updating docs or onboarding teams, use backend route/service behavior and frontend page behavior in the running code as the source of truth over historical notes.

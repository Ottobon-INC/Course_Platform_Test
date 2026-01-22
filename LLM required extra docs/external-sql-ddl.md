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


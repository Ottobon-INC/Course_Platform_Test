-- ============================================================================
-- Migration: Formalise quiz_attempts and module_progress in Prisma schema
-- These tables were created outside Prisma migrations and accessed via raw SQL.
-- This migration ensures the tables match the new Prisma models and adds
-- any missing columns / indexes.  All DDL uses IF NOT EXISTS / IF EXISTS so
-- it is safe to run on a DB that already has the tables and data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- quiz_attempts
-- Expected columns (all should already exist):
--   attempt_id, user_id, course_id, module_no, topic_pair_index,
--   assessment_id, question_set, answers, score, status, completed_at,
--   created_at, updated_at
-- ----------------------------------------------------------------------------

-- Ensure the table exists (safe no-op if it already does)
CREATE TABLE IF NOT EXISTS "quiz_attempts" (
  "attempt_id"       UUID         NOT NULL DEFAULT gen_random_uuid(),
  "user_id"          UUID         NOT NULL,
  "course_id"        UUID         NOT NULL,
  "module_no"        INTEGER      NOT NULL,
  "topic_pair_index" INTEGER      NOT NULL DEFAULT 1,
  "assessment_id"    UUID         NOT NULL,
  "question_set"     JSONB        NOT NULL DEFAULT '[]',
  "answers"          JSONB,
  "score"            INTEGER,
  "status"           TEXT,
  "completed_at"     TIMESTAMPTZ,
  "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("attempt_id")
);

-- Add any columns that might be missing on older deployments
ALTER TABLE "quiz_attempts"
  ADD COLUMN IF NOT EXISTS "topic_pair_index" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "answers"   JSONB,
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Indexes for quiz_attempts
CREATE INDEX IF NOT EXISTS "idx_quiz_attempts_user_course"
  ON "quiz_attempts" ("user_id", "course_id");

CREATE INDEX IF NOT EXISTS "idx_quiz_attempts_course_module"
  ON "quiz_attempts" ("course_id", "module_no");

CREATE INDEX IF NOT EXISTS "idx_quiz_attempts_assessment"
  ON "quiz_attempts" ("assessment_id");

CREATE INDEX IF NOT EXISTS "idx_quiz_attempts_user_assessment_completed"
  ON "quiz_attempts" ("user_id", "assessment_id", "completed_at");

-- ----------------------------------------------------------------------------
-- module_progress
-- Expected columns (all should already exist):
--   progress_id (may not exist — add it), user_id, course_id, module_no,
--   videos_completed, quiz_passed, unlocked_at, cooldown_until, passed_at,
--   completed_at, updated_at
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "module_progress" (
  "progress_id"       UUID         NOT NULL DEFAULT gen_random_uuid(),
  "user_id"           UUID         NOT NULL,
  "course_id"         UUID         NOT NULL,
  "module_no"         INTEGER      NOT NULL,
  "videos_completed"  JSONB        NOT NULL DEFAULT '[]',
  "quiz_passed"       BOOLEAN      NOT NULL DEFAULT FALSE,
  "unlocked_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "cooldown_until"    TIMESTAMPTZ,
  "passed_at"         TIMESTAMPTZ,
  "completed_at"      TIMESTAMPTZ,
  "updated_at"        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT "module_progress_pkey" PRIMARY KEY ("progress_id")
);

-- Add the surrogate PK column if the table existed without it
ALTER TABLE "module_progress"
  ADD COLUMN IF NOT EXISTS "progress_id" UUID NOT NULL DEFAULT gen_random_uuid();

-- Only add the primary key if no primary key constraint exists yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'module_progress' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_pkey" PRIMARY KEY ("progress_id");
  END IF;
END $$;

-- Ensure the unique constraint on (user_id, course_id, module_no) exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'module_progress'
      AND constraint_name = 'uq_module_progress_user_course_module'
  ) THEN
    ALTER TABLE "module_progress"
      ADD CONSTRAINT "uq_module_progress_user_course_module"
      UNIQUE ("user_id", "course_id", "module_no");
  END IF;
END $$;

-- Add any columns that might be missing
ALTER TABLE "module_progress"
  ADD COLUMN IF NOT EXISTS "videos_completed" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Indexes for module_progress
CREATE INDEX IF NOT EXISTS "idx_module_progress_user_course"
  ON "module_progress" ("user_id", "course_id");

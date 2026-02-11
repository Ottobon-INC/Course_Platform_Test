-- ============================================================
-- BACKGROUND JOBS: Postgres-Native Job Queue
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Create the enum type
-- (IF NOT EXISTS prevents errors if re-run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BackgroundJobStatus') THEN
    CREATE TYPE "BackgroundJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
  END IF;
END
$$;

-- 2. Create the table
CREATE TABLE IF NOT EXISTS "background_jobs" (
  "job_id"        UUID             NOT NULL DEFAULT gen_random_uuid(),
  "job_type"      TEXT             NOT NULL,
  "status"        "BackgroundJobStatus" NOT NULL DEFAULT 'PENDING'::"BackgroundJobStatus",
  "payload"       JSONB            NOT NULL,
  "result"        JSONB,
  "error_message" TEXT,
  "attempts"      INTEGER          NOT NULL DEFAULT 0,
  "max_attempts"  INTEGER          NOT NULL DEFAULT 3,
  "user_id"       UUID             NOT NULL,
  "session_id"    UUID,
  "locked_at"     TIMESTAMPTZ,
  "created_at"    TIMESTAMPTZ      NOT NULL DEFAULT now(),
  "completed_at"  TIMESTAMPTZ,
  "updated_at"    TIMESTAMPTZ      NOT NULL DEFAULT now(),

  CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("job_id")
);

-- 3. Create indexes for efficient queue operations
CREATE INDEX IF NOT EXISTS "idx_bg_job_status_created"
  ON "background_jobs" ("status", "created_at");

CREATE INDEX IF NOT EXISTS "idx_bg_job_user_type"
  ON "background_jobs" ("user_id", "job_type");

CREATE INDEX IF NOT EXISTS "idx_bg_job_session"
  ON "background_jobs" ("session_id");

-- 4. Verify (optional — run this SELECT to confirm)
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'background_jobs'
-- ORDER BY ordinal_position;

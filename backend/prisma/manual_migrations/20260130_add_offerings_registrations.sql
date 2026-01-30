-- Manual migration: Option B (3 tables)
-- Adds: enums, course_offerings, registrations, assessment_questions

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'program_type') THEN
    CREATE TYPE program_type AS ENUM ('cohort', 'ondemand', 'workshop');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_audience') THEN
    CREATE TYPE assessment_audience AS ENUM ('all', 'cohort', 'ondemand', 'workshop');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
    CREATE TYPE question_type AS ENUM ('text', 'mcq');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS course_offerings (
  offering_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  program_type program_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  price_cents INTEGER NOT NULL DEFAULT 0,
  application_required BOOLEAN NOT NULL DEFAULT false,
  assessment_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_course_offering_course_program_title UNIQUE (course_id, program_type, title)
);

CREATE INDEX IF NOT EXISTS idx_course_offering_course ON course_offerings(course_id);

CREATE TABLE IF NOT EXISTS registrations (
  registration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES course_offerings(offering_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  college_name TEXT NOT NULL,
  year_of_passing TEXT NOT NULL,
  branch TEXT NOT NULL,
  referred_by TEXT,
  selected_slot TEXT,
  session_time TEXT,
  mode TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  answers_json JSONB,
  questions_snapshot JSONB,
  assessment_submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_registration_email_offering UNIQUE (email, offering_id)
);

CREATE INDEX IF NOT EXISTS idx_registration_offering ON registrations(offering_id);

CREATE TABLE IF NOT EXISTS assessment_questions (
  question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_type assessment_audience NOT NULL DEFAULT 'all',
  offering_id UUID REFERENCES course_offerings(offering_id) ON DELETE SET NULL,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL DEFAULT 'text',
  mcq_options JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_question_program_type ON assessment_questions(program_type);
CREATE INDEX IF NOT EXISTS idx_assessment_question_offering ON assessment_questions(offering_id);

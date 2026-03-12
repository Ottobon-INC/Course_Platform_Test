-- Manual migration: Make workshop academic background optional using student status
-- Safe to run in Supabase SQL editor.

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS is_college_student BOOLEAN;

ALTER TABLE registrations
  ALTER COLUMN college_name DROP NOT NULL,
  ALTER COLUMN year_of_passing DROP NOT NULL,
  ALTER COLUMN branch DROP NOT NULL;

-- Backfill existing rows for consistency:
-- If all academic fields are blank/null -> false, otherwise true.
UPDATE registrations
SET is_college_student = CASE
  WHEN COALESCE(TRIM(college_name), '') = ''
    AND COALESCE(TRIM(year_of_passing), '') = ''
    AND COALESCE(TRIM(branch), '') = ''
  THEN FALSE
  ELSE TRUE
END
WHERE is_college_student IS NULL;


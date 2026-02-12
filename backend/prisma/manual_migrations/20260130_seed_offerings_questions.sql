-- Seed offerings + minimal questions (safe: only inserts new rows)
DO $$
DECLARE
  cid UUID;
  off_cohort UUID;
  off_ondemand UUID;
BEGIN
  SELECT course_id
  INTO cid
  FROM courses
  WHERE slug = 'ai-native-fullstack-developer'
     OR course_name ILIKE '%AI Native Full Stack Developer%'
  LIMIT 1;

  IF cid IS NULL THEN
    RAISE NOTICE 'Course not found. Seed skipped.';
    RETURN;
  END IF;

  INSERT INTO course_offerings (
    course_id,
    program_type,
    title,
    description,
    is_active,
    price_cents,
    application_required,
    assessment_required
  )
  VALUES
    (cid, 'cohort', 'AI Native Full Stack Developer (Cohort)', 'Live cohort-based program', true, 0, true, true),
    (cid, 'ondemand', 'AI Native Full Stack Developer (On-Demand)', 'Self-paced program', true, 0, false, false)
  ON CONFLICT (course_id, program_type, title) DO NOTHING;

  SELECT offering_id INTO off_cohort
  FROM course_offerings
  WHERE course_id = cid AND program_type = 'cohort'
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT offering_id INTO off_ondemand
  FROM course_offerings
  WHERE course_id = cid AND program_type = 'ondemand'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Minimal questions (shared + cohort-specific)
  INSERT INTO assessment_questions (
    program_type,
    offering_id,
    question_number,
    question_text,
    question_type,
    mcq_options,
    is_active
  )
  VALUES
    ('all', NULL, 1, 'What outcome do you want from this program?', 'text', NULL, true),
    ('cohort', off_cohort, 2, 'How many hours per week can you commit?', 'mcq',
      '["2-4","5-8","9-12","12+"]'::jsonb, true),
    ('cohort', off_cohort, 3, 'Describe a time you learned something difficult and how you did it.', 'text', NULL, true)
  ON CONFLICT DO NOTHING;
END $$;

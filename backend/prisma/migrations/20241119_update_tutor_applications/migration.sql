ALTER TABLE tutor_applications
    RENAME COLUMN proposed_course_title TO course_title;

ALTER TABLE tutor_applications
    RENAME COLUMN course_outline TO course_description;

ALTER TABLE tutor_applications
    RENAME COLUMN motivation TO headline;

UPDATE tutor_applications
SET course_description = ''
WHERE course_description IS NULL;

UPDATE tutor_applications
SET headline = ''
WHERE headline IS NULL;

ALTER TABLE tutor_applications
    ALTER COLUMN course_description SET NOT NULL,
    ALTER COLUMN headline SET NOT NULL;

ALTER TABLE tutor_applications
    DROP COLUMN course_level,
    DROP COLUMN delivery_format;

ALTER TABLE tutor_applications
    ADD COLUMN target_audience text NOT NULL DEFAULT '';

ALTER TABLE tutor_applications
    ALTER COLUMN target_audience DROP DEFAULT;

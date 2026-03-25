-- Manual migration: Add slug column to cp_blogs for SEO-friendly URLs
-- Run this in your Supabase/PostgreSQL SQL editor.

-- 1. Add the slug column (nullable first so backfill can run)
ALTER TABLE cp_blogs
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Backfill slugs from existing titles
--    Converts title -> lowercase, replaces spaces & special chars with hyphens, trims dashes
UPDATE cp_blogs
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRIM(title),
        '[^a-zA-Z0-9\s\-]', '', 'g'   -- remove non-alphanumeric, non-space, non-dash
      ),
      '\s+', '-', 'g'                   -- replace whitespace runs with a single dash
    ),
    '-{2,}', '-', 'g'                   -- collapse multiple consecutive dashes
  )
)
WHERE slug IS NULL AND title IS NOT NULL;

-- 3. Handle duplicate slugs by appending a short suffix from the UUID
--    (runs only if duplicates exist after the backfill above)
UPDATE cp_blogs AS b
SET slug = b.slug || '-' || SUBSTRING(b.id::text FROM 1 FOR 6)
WHERE b.id IN (
  SELECT id FROM (
    SELECT id, slug, COUNT(*) OVER (PARTITION BY slug) AS cnt
    FROM cp_blogs
    WHERE slug IS NOT NULL
  ) t
  WHERE t.cnt > 1
  -- Keep the first occurrence as-is; update the rest
  AND id NOT IN (
    SELECT DISTINCT ON (slug) id
    FROM cp_blogs
    WHERE slug IS NOT NULL
    ORDER BY slug, created_at ASC NULLS LAST
  )
);

-- 4. Add unique index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_cp_blogs_slug ON cp_blogs (slug);

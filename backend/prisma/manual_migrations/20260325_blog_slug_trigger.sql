-- Auto-generate slug on INSERT for cp_blogs
-- This trigger fires automatically whenever any new blog is inserted,
-- so the scraper doesn't need any changes.

-- 1. Create the slug-generation function
CREATE OR REPLACE FUNCTION generate_blog_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter   INT := 0;
BEGIN
  -- Only generate if slug is not already provided
  IF NEW.slug IS NOT NULL AND TRIM(NEW.slug) != '' THEN
    RETURN NEW;
  END IF;

  -- Build slug from title: lowercase, remove special chars, replace spaces with hyphens
  base_slug := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          COALESCE(TRIM(NEW.title), 'untitled'),
          '[^a-zA-Z0-9\s\-]', '', 'g'   -- strip special chars
        ),
        '\s+', '-', 'g'                   -- spaces -> hyphens
      ),
      '-{2,}', '-', 'g'                   -- collapse double dashes
    )
  );

  -- Trim leading/trailing dashes
  base_slug := TRIM(BOTH '-' FROM base_slug);

  -- Limit slug length to 80 chars (good for SEO)
  base_slug := LEFT(base_slug, 80);

  -- Handle uniqueness: if slug already exists, append -2, -3, etc.
  final_slug := base_slug;
  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM cp_blogs WHERE slug = final_slug AND id != NEW.id
    );
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger on cp_blogs
DROP TRIGGER IF EXISTS trg_cp_blogs_slug ON cp_blogs;

CREATE TRIGGER trg_cp_blogs_slug
  BEFORE INSERT ON cp_blogs
  FOR EACH ROW
  EXECUTE FUNCTION generate_blog_slug();

-- 3. Also handle UPDATE (in case title changes or slug is cleared)
DROP TRIGGER IF EXISTS trg_cp_blogs_slug_update ON cp_blogs;

CREATE TRIGGER trg_cp_blogs_slug_update
  BEFORE UPDATE ON cp_blogs
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR TRIM(NEW.slug) = '')
  EXECUTE FUNCTION generate_blog_slug();

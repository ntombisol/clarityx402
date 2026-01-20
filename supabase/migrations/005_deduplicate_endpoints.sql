-- Deduplicate endpoints with similar URLs (trailing slashes, case differences)
-- This migration normalizes URLs and removes duplicates, keeping the most recently updated record

-- Step 1: Create a temporary function to normalize URLs in SQL
CREATE OR REPLACE FUNCTION normalize_url(url TEXT) RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Lowercase the entire URL and remove trailing slashes
  result := LOWER(url);
  result := REGEXP_REPLACE(result, '/+$', '');
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 2: Identify and delete duplicates, keeping the record with most recent updated_at
-- For each group of duplicates (same normalized URL), keep only the one with the latest updated_at
WITH normalized AS (
  SELECT
    id,
    resource_url,
    normalize_url(resource_url) as normalized_url,
    updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY normalize_url(resource_url)
      ORDER BY updated_at DESC NULLS LAST, id
    ) as rn
  FROM endpoints
),
duplicates AS (
  SELECT id FROM normalized WHERE rn > 1
)
DELETE FROM endpoints WHERE id IN (SELECT id FROM duplicates);

-- Step 3: Update all remaining endpoints to use normalized URLs
UPDATE endpoints
SET resource_url = normalize_url(resource_url)
WHERE resource_url != normalize_url(resource_url);

-- Step 4: Clean up - drop the temporary function
DROP FUNCTION IF EXISTS normalize_url(TEXT);

-- Log completion (this will appear in migration logs)
DO $$
DECLARE
  endpoint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO endpoint_count FROM endpoints;
  RAISE NOTICE 'Deduplication complete. % endpoints remaining.', endpoint_count;
END $$;

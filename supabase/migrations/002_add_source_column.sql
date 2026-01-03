-- Migration: Add source column to endpoints table
-- This tracks which data source the endpoint was discovered from

-- Add source column to endpoints
ALTER TABLE endpoints
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'bazaar';

-- Add index for filtering by source
CREATE INDEX IF NOT EXISTS idx_endpoints_source ON endpoints(source);

-- Update comment
COMMENT ON COLUMN endpoints.source IS 'Data source: bazaar, x402apis, etc.';

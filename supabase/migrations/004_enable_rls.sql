-- Enable Row Level Security on all tables
-- Public read access, writes restricted to service role only

-- Enable RLS on endpoints
ALTER TABLE endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on endpoints"
  ON endpoints
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Enable RLS on pings
ALTER TABLE pings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on pings"
  ON pings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Enable RLS on price_history
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on price_history"
  ON price_history
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on categories"
  ON categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Note: Service role key bypasses RLS, so cron jobs can still write
-- No INSERT/UPDATE/DELETE policies needed for public users

-- Clarityx402 Initial Schema
-- Run this migration in your Supabase SQL Editor

-- Core endpoints table (synced from Bazaar)
CREATE TABLE IF NOT EXISTS endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_url TEXT UNIQUE NOT NULL,
  bazaar_data JSONB NOT NULL,  -- Raw Bazaar response

  -- Extracted fields for querying
  description TEXT,
  price_micro_usdc BIGINT,  -- maxAmountRequired in micro USDC
  network TEXT,  -- 'base', 'solana', etc.
  pay_to_address TEXT,

  -- Our enrichments
  category TEXT,
  tags TEXT[],
  normalized_price JSONB,  -- { "unit": "per_1k_tokens", "value": 0.01 }

  -- Quality metrics (computed from pings)
  uptime_24h DECIMAL(5,2),
  uptime_7d DECIMAL(5,2),
  uptime_30d DECIMAL(5,2),
  avg_latency_ms INTEGER,
  p95_latency_ms INTEGER,
  error_rate DECIMAL(5,4),
  last_seen_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  consecutive_failures INTEGER DEFAULT 0,

  -- Metadata
  first_indexed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Health check pings (time-series)
CREATE TABLE IF NOT EXISTS pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES endpoints(id) ON DELETE CASCADE,
  pinged_at TIMESTAMPTZ DEFAULT NOW(),

  -- Results
  success BOOLEAN NOT NULL,
  status_code INTEGER,
  latency_ms INTEGER,
  error_message TEXT,

  -- For analysis
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price history (daily snapshots)
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES endpoints(id) ON DELETE CASCADE,
  recorded_at DATE NOT NULL,
  price_micro_usdc BIGINT NOT NULL,

  UNIQUE(endpoint_id, recorded_at)
);

-- Categories reference
CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,  -- icon name (lucide icons)
  endpoint_count INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pings_endpoint_time ON pings(endpoint_id, pinged_at DESC);
CREATE INDEX IF NOT EXISTS idx_endpoints_category ON endpoints(category);
CREATE INDEX IF NOT EXISTS idx_endpoints_is_active ON endpoints(is_active);
CREATE INDEX IF NOT EXISTS idx_endpoints_updated_at ON endpoints(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_endpoint ON price_history(endpoint_id, recorded_at DESC);

-- Seed initial categories
INSERT INTO categories (slug, name, description, icon) VALUES
  ('llm-inference', 'LLM Inference', 'Chat completions and text generation', 'bot'),
  ('image-generation', 'Image Generation', 'Text-to-image and image editing', 'image'),
  ('data-feeds', 'Data Feeds', 'Crypto prices, news, weather', 'chart-line'),
  ('security', 'Security', 'Wallet verification, contract scanning', 'shield'),
  ('search', 'Search', 'Web search, social media queries', 'search'),
  ('utilities', 'Utilities', 'QR codes, URL tools, etc.', 'wrench'),
  ('defi', 'DeFi', 'Pool data, trading signals, yields', 'coins'),
  ('social', 'Social', 'Twitter/X, Farcaster data', 'users')
ON CONFLICT (slug) DO NOTHING;

-- Function to update endpoint_count in categories
CREATE OR REPLACE FUNCTION update_category_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the old category count if category changed
  IF TG_OP = 'UPDATE' AND OLD.category IS DISTINCT FROM NEW.category THEN
    UPDATE categories SET endpoint_count = (
      SELECT COUNT(*) FROM endpoints WHERE category = OLD.category AND is_active = true
    ) WHERE slug = OLD.category;
  END IF;

  -- Update the new category count
  IF NEW.category IS NOT NULL THEN
    UPDATE categories SET endpoint_count = (
      SELECT COUNT(*) FROM endpoints WHERE category = NEW.category AND is_active = true
    ) WHERE slug = NEW.category;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update category counts
DROP TRIGGER IF EXISTS trigger_update_category_counts ON endpoints;
CREATE TRIGGER trigger_update_category_counts
  AFTER INSERT OR UPDATE OF category, is_active ON endpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_category_counts();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_endpoints_updated_at ON endpoints;
CREATE TRIGGER trigger_update_endpoints_updated_at
  BEFORE UPDATE ON endpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

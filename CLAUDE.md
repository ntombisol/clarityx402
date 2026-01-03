# Clarityx402 - Implementation Plan

## Overview
Build the complete Clarityx402 MVP (Phases 1-4) with full dashboard, API, and MCP server.

**One-liner:** The quality and price intelligence layer for x402 - helping agents find the best endpoint for any task, not just any endpoint.

**Product Name:** Clarityx402

---

## Current Status (Jan 2026)

### Endpoints Indexed
- **Total:** 1,415 endpoints
- **Base:** 1,023 | **Base-sepolia:** 384 | **Solana:** 10

### What's Working
- ✅ Full dashboard with network filtering
- ✅ Multi-source data architecture (Bazaar + x402apis.io ready)
- ✅ Health checks running (50 endpoints per 5-min cycle)
- ✅ Auto-ingestion with retry logic for rate limits
- ✅ MCP server built (needs testing with Claude Desktop)

### Recent Changes
- Added `source` column to track data origin (migration 002)
- Fixed `error_rate` precision overflow (migration 003)
- Added network normalization (EIP-155 chain IDs → friendly names)
- Added network filter badges to UI (Base, Solana, Polygon)
- Implemented exponential backoff for Bazaar API rate limits

---

## Project Structure

```
x402/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── cron/
│   │   │   │   ├── ingest/route.ts        # Bazaar ingestion (every 10m)
│   │   │   │   ├── health-check/route.ts  # Endpoint pinging (every 5m)
│   │   │   │   └── price-snapshot/route.ts # Daily price history
│   │   │   ├── endpoints/
│   │   │   │   ├── route.ts               # GET /api/endpoints
│   │   │   │   └── [id]/route.ts          # GET /api/endpoints/[id]
│   │   │   ├── compare/route.ts           # GET /api/compare
│   │   │   ├── recommend/route.ts         # GET /api/recommend
│   │   │   ├── health/[url]/route.ts      # GET /api/health/[url]
│   │   │   ├── categories/route.ts        # GET /api/categories
│   │   │   └── price-history/[id]/route.ts
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx                   # Home/overview
│   │   │   ├── endpoints/
│   │   │   │   ├── page.tsx               # Browse endpoints
│   │   │   │   └── [id]/page.tsx          # Endpoint detail
│   │   │   ├── compare/page.tsx           # Comparison view
│   │   │   ├── categories/page.tsx        # Category browser
│   │   │   └── status/page.tsx            # Ecosystem health
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                  # Browser client
│   │   │   ├── server.ts                  # Server client
│   │   │   └── admin.ts                   # Service role client
│   │   ├── bazaar/
│   │   │   ├── client.ts                  # Bazaar API client (CDP JWT auth)
│   │   │   └── types.ts                   # Bazaar response types
│   │   ├── sources/                       # Multi-source data architecture
│   │   │   ├── index.ts                   # Exports
│   │   │   ├── types.ts                   # Common DataSource interface
│   │   │   ├── aggregator.ts              # Combines sources, deduplicates
│   │   │   ├── bazaar-adapter.ts          # Bazaar → DataSource adapter
│   │   │   └── x402apis.ts                # x402apis.io client (Solana)
│   │   ├── classifier/
│   │   │   └── index.ts                   # Auto-categorization logic
│   │   ├── metrics/
│   │   │   └── calculator.ts              # Uptime/latency calculations
│   │   └── utils.ts
│   ├── components/
│   │   ├── ui/                            # shadcn/ui components
│   │   ├── endpoints/
│   │   │   ├── endpoint-card.tsx
│   │   │   ├── endpoint-table.tsx
│   │   │   └── endpoint-filters.tsx
│   │   ├── charts/
│   │   │   ├── uptime-chart.tsx
│   │   │   ├── latency-chart.tsx
│   │   │   └── price-chart.tsx
│   │   └── layout/
│   │       ├── navbar.tsx
│   │       ├── sidebar.tsx
│   │       └── footer.tsx
│   └── types/
│       └── index.ts                       # Shared TypeScript types
├── mcp-server/
│   ├── src/
│   │   ├── index.ts                       # MCP server entry
│   │   ├── tools/
│   │   │   ├── find-best-endpoint.ts
│   │   │   ├── compare-endpoints.ts
│   │   │   ├── check-endpoint-health.ts
│   │   │   ├── get-price-history.ts
│   │   │   └── list-categories.ts
│   │   └── api-client.ts                  # Calls main API
│   ├── package.json
│   └── tsconfig.json
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_add_source_column.sql      # Track data source origin
│       └── 003_fix_error_rate_precision.sql
├── vercel.json                            # Cron configuration
├── .env.local
├── .env.example
└── package.json
```

---

## Implementation Tasks

### Step 1: Project Initialization
- [x] Initialize Next.js 14 with TypeScript, Tailwind, App Router
- [x] Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`
- [x] Set up shadcn/ui with required components
- [x] Configure environment variables (.env.local, .env.example)
- [x] Create Supabase client utilities (client, server, admin)

### Step 2: Database Setup
- [x] Create migration file with full schema:
  - `endpoints` table (core endpoint data + quality metrics)
  - `pings` table (time-series health checks)
  - `price_history` table (daily snapshots)
  - `categories` table (taxonomy reference)
- [x] Add indexes for performance (pings by endpoint+time, endpoints by category)
- [x] Seed initial categories
- [x] Run migration in Supabase

### Step 3: Bazaar Ingestion Worker
- [x] Create Bazaar API client with types
- [x] Implement ingestion route `/api/cron/ingest`
  - Fetch from Coinbase Bazaar API (with CDP JWT auth)
  - Parse and transform response (handles `items` format with pagination)
  - Upsert endpoints to database
  - Auto-classify categories on insert
- [x] Add error handling and logging

### Step 4: Quality Monitor Worker
- [x] Implement health check route `/api/cron/health-check`
  - Batch fetch active endpoints
  - Ping each with 5s timeout
  - Record results in `pings` table
  - Update rolling metrics in `endpoints`
- [x] Create metrics calculator for uptime/latency aggregation

### Step 5: Category Classifier
- [x] Build keyword-based auto-classifier
  - Map keywords to categories (llm, image, defi, etc.)
  - Extract tags from descriptions
- [x] Implement classification on ingestion

### Step 6: REST API Endpoints
- [x] `GET /api/endpoints` - List with filters (category, uptime, price, sort)
- [x] `GET /api/endpoints/[id]` - Full endpoint details with history
- [x] `GET /api/compare` - Category comparison with ranking
- [x] `GET /api/recommend` - Single best recommendation
- [x] `GET /api/health/[url]` - Current health status
- [x] `GET /api/categories` - List categories with counts
- [x] `GET /api/price-history/[id]` - Historical pricing

### Step 7: Dashboard UI
- [x] Layout: Navbar, responsive design
- [x] Home page: Ecosystem overview, stats, recent activity
- [x] Endpoints browse: Table with filters, sorting, pagination
- [x] Endpoint detail: Quality metrics, price, metadata
- [x] Compare page: Side-by-side category comparison
- [x] Categories page: Browse by category
- [x] Status page: Ecosystem health overview

### Step 8: MCP Server
- [x] Set up separate mcp-server package
- [x] Implement tools:
  - `find_best_endpoint` - Best for task/budget
  - `compare_endpoints` - Compare category options
  - `check_endpoint_health` - Current status
  - `get_price_history` - Historical prices
  - `list_categories` - Available categories
- [x] Create API client to call main REST API
- [ ] Test with Claude Desktop

### Step 9: Cron Configuration
- [x] Configure vercel.json with cron schedules:
  - Ingest: every 10 minutes
  - Health check: every 5 minutes
  - Price snapshot: daily

### Step 10: Open Source Release
- [x] Add MIT LICENSE
- [x] Create CONTRIBUTING.md
- [x] Update README with setup instructions
- [ ] Publish to GitHub

---

## Database Schema

```sql
-- Core endpoints table (synced from Bazaar)
CREATE TABLE endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_url TEXT UNIQUE NOT NULL,
  bazaar_data JSONB NOT NULL,  -- Raw Bazaar response

  -- Extracted fields for querying
  description TEXT,
  price_micro_usdc BIGINT,  -- maxAmountRequired
  network TEXT,  -- 'base', 'solana', etc.
  pay_to_address TEXT,

  -- Our enrichments
  category TEXT,
  tags TEXT[],
  normalized_price JSONB,  -- { "unit": "per_1k_tokens", "value": 0.01 }

  -- Quality metrics (computed)
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
CREATE TABLE pings (
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

-- Index for efficient time-range queries
CREATE INDEX idx_pings_endpoint_time ON pings(endpoint_id, pinged_at DESC);

-- Price history (daily snapshots)
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES endpoints(id) ON DELETE CASCADE,
  recorded_at DATE NOT NULL,
  price_micro_usdc BIGINT NOT NULL,

  UNIQUE(endpoint_id, recorded_at)
);

-- Categories reference
CREATE TABLE categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,  -- emoji or icon name
  endpoint_count INTEGER DEFAULT 0
);

-- Seed categories
INSERT INTO categories (slug, name, description, icon) VALUES
  ('llm-inference', 'LLM Inference', 'Chat completions and text generation', 'bot'),
  ('image-generation', 'Image Generation', 'Text-to-image and image editing', 'image'),
  ('data-feeds', 'Data Feeds', 'Crypto prices, news, weather', 'chart'),
  ('security', 'Security', 'Wallet verification, contract scanning', 'shield'),
  ('search', 'Search', 'Web search, social media queries', 'search'),
  ('utilities', 'Utilities', 'QR codes, URL tools, etc.', 'wrench'),
  ('defi', 'DeFi', 'Pool data, trading signals, yields', 'coins'),
  ('social', 'Social', 'Twitter/X, Farcaster data', 'users');
```

---

## Key API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/endpoints?category=&min_uptime=&max_price=&sort=` | List with filtering/sorting |
| `GET /api/endpoints/[id]` | Single endpoint details |
| `GET /api/compare?category=&sort=` | Category comparison |
| `GET /api/recommend?task=&budget=` | Best recommendation |
| `GET /api/health/[url]` | Endpoint health check |
| `GET /api/categories` | List categories |
| `GET /api/price-history/[id]?days=` | Historical prices |

---

## MCP Server Tools

| Tool | Description |
|------|-------------|
| `find_best_endpoint` | Given a task, return the optimal endpoint |
| `compare_endpoints` | Compare options for a category |
| `check_endpoint_health` | Get current status of a specific endpoint |
| `get_price_history` | Historical pricing for an endpoint |
| `list_categories` | Available service categories |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Bazaar API (CDP authentication required)
BAZAAR_API_URL=https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources
CDP_API_KEY_NAME=         # From Coinbase Developer Platform
CDP_API_KEY_SECRET=       # Base64 encoded ES256 private key

# Cron Secret (for securing cron endpoints)
CRON_SECRET=

# Optional: Rate limiting
RATE_LIMIT_FREE_TIER=100
```

---

## Vercel Cron Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/ingest",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/api/cron/health-check",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/price-snapshot",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Note:** Vercel free tier allows 2 cron jobs. Pro tier needed for 3, or combine price-snapshot into ingest job.

---

## Dependencies

**Main App:**
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",
    "next": "14.x",
    "react": "18.x",
    "tailwindcss": "3.x"
  }
}
```

**MCP Server (separate package):**
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.x"
  }
}
```

---

## Next Steps

### Immediate (Ready to Deploy)
1. **Deploy to Vercel** - Cron jobs will auto-run once deployed
2. **Test MCP Server with Claude Desktop** - Verify tool integration works
3. **Add more network colors** - BSC, Arbitrum, Optimism badges

### Short-term Improvements
4. **Improve category classifier** - Many endpoints uncategorized, enhance keyword matching
5. **Add provider grouping** - Group endpoints by provider/domain for easier browsing
6. **Uptime charts** - Visualize 24h/7d/30d uptime trends on endpoint detail page
7. **Search improvements** - Full-text search across descriptions

### Future Enhancements
8. **Enable x402apis.io** - Set `ENABLE_X402APIS=true` when they have registered providers
9. **Webhook notifications** - Alert when endpoints go down or prices change
10. **More chains** - Add Arbitrum, Optimism, BSC data sources
11. **Historical analytics** - Long-term uptime trends, price history charts

### Known Issues
- Bazaar API has Envoy-level rate limiting (stricter than documented 600 req/10s)
- Some endpoints return non-standard network formats (handled by normalization)

---

## External Resources

- **x402 Protocol:** https://github.com/coinbase/x402
- **Bazaar API:** https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources
- **x402apis.io:** https://x402apis.io (Solana-focused, registry currently empty)
- **MCP SDK:** https://modelcontextprotocol.io
- **Supabase Docs:** https://supabase.com/docs
- **shadcn/ui:** https://ui.shadcn.com

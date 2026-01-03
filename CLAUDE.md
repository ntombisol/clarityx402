# Clarityx402 - Implementation Plan

## Overview
Build the complete Clarityx402 MVP (Phases 1-4) with full dashboard, API, and MCP server.

**One-liner:** The quality and price intelligence layer for x402 - helping agents find the best endpoint for any task, not just any endpoint.

**Product Name:** Clarityx402

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
│   │   │   ├── client.ts                  # Bazaar API client
│   │   │   └── types.ts                   # Bazaar response types
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
│       └── 001_initial_schema.sql
├── vercel.json                            # Cron configuration
├── .env.local
├── .env.example
└── package.json
```

---

## Implementation Tasks

### Step 1: Project Initialization
- [ ] Initialize Next.js 14 with TypeScript, Tailwind, App Router
- [ ] Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`
- [ ] Set up shadcn/ui with required components
- [ ] Configure environment variables (.env.local, .env.example)
- [ ] Create Supabase client utilities (client, server, admin)

### Step 2: Database Setup
- [ ] Create migration file with full schema:
  - `endpoints` table (core endpoint data + quality metrics)
  - `pings` table (time-series health checks)
  - `price_history` table (daily snapshots)
  - `categories` table (taxonomy reference)
- [ ] Add indexes for performance (pings by endpoint+time, endpoints by category)
- [ ] Seed initial categories
- [ ] Run migration in Supabase

### Step 3: Bazaar Ingestion Worker
- [ ] Create Bazaar API client with types
- [ ] Implement ingestion route `/api/cron/ingest`
  - Fetch from Coinbase Bazaar API
  - Parse and transform response
  - Upsert endpoints to database
  - Auto-classify categories on insert
- [ ] Add error handling and logging

### Step 4: Quality Monitor Worker
- [ ] Implement health check route `/api/cron/health-check`
  - Batch fetch active endpoints
  - Ping each with 5s timeout
  - Record results in `pings` table
  - Update rolling metrics in `endpoints`
- [ ] Create metrics calculator for uptime/latency aggregation

### Step 5: Category Classifier
- [ ] Build keyword-based auto-classifier
  - Map keywords to categories (llm, image, defi, etc.)
  - Extract tags from descriptions
- [ ] Implement classification on ingestion

### Step 6: REST API Endpoints
- [ ] `GET /api/endpoints` - List with filters (category, uptime, price, sort)
- [ ] `GET /api/endpoints/[id]` - Full endpoint details with history
- [ ] `GET /api/compare` - Category comparison with ranking
- [ ] `GET /api/recommend` - Single best recommendation
- [ ] `GET /api/health/[url]` - Current health status
- [ ] `GET /api/categories` - List categories with counts
- [ ] `GET /api/price-history/[id]` - Historical pricing

### Step 7: Dashboard UI
- [ ] Layout: Navbar, Sidebar, responsive design
- [ ] Home page: Ecosystem overview, stats, recent activity
- [ ] Endpoints browse: Table with filters, sorting, pagination
- [ ] Endpoint detail: Quality charts, price history, metadata
- [ ] Compare page: Side-by-side category comparison
- [ ] Categories page: Browse by category
- [ ] Status page: Ecosystem health overview

### Step 8: MCP Server
- [ ] Set up separate mcp-server package
- [ ] Implement tools:
  - `find_best_endpoint` - Best for task/budget
  - `compare_endpoints` - Compare category options
  - `check_endpoint_health` - Current status
  - `get_price_history` - Historical prices
  - `list_categories` - Available categories
- [ ] Create API client to call main REST API
- [ ] Test with Claude Desktop

### Step 9: Cron Configuration
- [ ] Configure vercel.json with cron schedules:
  - Ingest: every 10 minutes
  - Health check: every 5 minutes
  - Price snapshot: daily

### Step 10: Monetization (Optional for MVP)
- [ ] Implement rate limiting middleware
- [ ] Add x402 payment integration for API access
- [ ] Create pricing tier logic

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

# Bazaar API (no auth required)
BAZAAR_API_URL=https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources

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

## External Resources

- **x402 Protocol:** https://github.com/coinbase/x402
- **Bazaar API:** https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources
- **MCP SDK:** https://modelcontextprotocol.io
- **Supabase Docs:** https://supabase.com/docs
- **shadcn/ui:** https://ui.shadcn.com

# x402 Intelligence Layer

## Project Specification Document
**Version:** 1.0
**Date:** December 24, 2024
**Author:** Tonbi Studio

---

## Executive Summary

The x402 Intelligence Layer is a quality and price monitoring infrastructure service for the x402 payment protocol ecosystem. While Coinbase's Bazaar provides basic endpoint discovery, it lacks quality metrics, price comparison, and intelligent routing. This project fills that gap, helping AI agents find not just *any* endpoint, but the *best* endpoint for their specific task.

**One-liner:** The quality and price intelligence layer for x402 — helping agents find the best endpoint for any task, not just any endpoint.

**Future expansion:** Once established, the platform can expand into spend tracking and budget controls, becoming the complete x402 infrastructure layer for agents (see Phase 5).

---

## Problem Statement

### The Current Landscape

The x402 protocol (developed by Coinbase) enables pay-per-request API access via HTTP 402 responses. It's designed for AI agents to autonomously pay for services without subscriptions or API keys. The ecosystem is growing rapidly with 80+ endpoints currently indexed.

### What Exists Today

| Product | What It Does | Limitation |
|---------|--------------|------------|
| **Coinbase Bazaar** | Official discovery layer - indexes x402 endpoints via `/discovery/resources` API | Directory only, no quality metrics |
| **x402apis.io** | Third-party registry with provider network | Early stage, no comparison features |
| **x402labs.cloud** | RPC aggregator with price comparison | RPC-only, not general x402 APIs |
| **x402scan / t54.ai** | Security scoring for x402 servers | Security focus, not quality/price |

### The Gap

Bazaar answers: *"What x402 endpoints exist?"*

But agents need answers to:
- "Which image generation API is cheapest right now?"
- "What's the average latency for this provider over the past week?"
- "Show me all LLM endpoints ranked by price-per-token"
- "Is this endpoint reliable? What's its uptime?"
- "This endpoint was $0.01 yesterday — why is it $0.05 today?"

**Nobody provides:**
- Quality metrics (uptime, latency, error rates)
- Price comparison across equivalent services
- Historical pricing data
- Category-based search and filtering
- Intelligent routing recommendations

---

## Solution Overview

### Core Value Proposition

Build an intelligence layer on top of Bazaar that transforms raw endpoint data into actionable insights for AI agents.

### Architecture Positioning

```
┌─────────────────────────────────────────────────────────┐
│                    x402 Ecosystem                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   Protocol Layer        Coinbase x402 spec, facilitators │
│         ↓                                                │
│   Discovery Layer       Coinbase Bazaar (raw directory)  │
│         ↓                                                │
│   Intelligence Layer    YOU (quality, price, routing)    │
│         ↓                                                │
│   Consumer Layer        AI Agents, Developers, Apps      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

You don't compete with Bazaar — you make Bazaar useful.

---

## Core Features

### 1. Quality Monitoring

**What:** Continuously monitor all Bazaar endpoints for reliability and performance.

**Metrics tracked:**
- Uptime percentage (24h, 7d, 30d)
- Average response latency
- P95 latency
- Error rate (non-2xx responses)
- Last successful ping timestamp
- Consecutive failure count

**Implementation:**
- Ping every endpoint every 5 minutes
- Store results in time-series format
- Calculate rolling aggregates
- Flag endpoints with degraded performance

### 2. Category Taxonomy

**What:** Classify endpoints by capability so agents can find what they need.

**Categories:**
- `llm-inference` — Chat completions, text generation
- `image-generation` — Text-to-image, image editing
- `data-feeds` — Crypto prices, news, weather
- `security` — Wallet verification, contract scanning
- `search` — Web search, social media search
- `utilities` — QR codes, URL shortening, etc.
- `defi` — Pool data, trading signals, yields
- `social` — Twitter/X data, Farcaster queries

**Tags:** Additional granular labels (e.g., "crypto", "news", "prediction-markets")

**Implementation:**
- Auto-classify based on endpoint description and schema
- Manual curation for ambiguous cases
- Allow community suggestions

### 3. Price Normalization & Tracking

**What:** Make prices comparable and track changes over time.

**Features:**
- Normalize to standard units where possible ($/1K tokens for LLMs)
- Store price history for every endpoint
- Calculate price trends (up/down/stable)
- Alert on significant price changes (>20%)

**Implementation:**
- Parse `maxAmountRequired` from Bazaar data
- Store historical snapshots (daily minimum)
- Compute normalized pricing for comparable services

### 4. Comparison API

**What:** RESTful API for querying and comparing endpoints.

**Key endpoints:**

```
GET /endpoints
  ?category=llm-inference
  ?min_uptime=95
  ?max_price=10000
  ?sort=price|latency|uptime
  ?limit=10

GET /endpoints/{id}
  → Full details including quality history

GET /compare
  ?category=image-generation
  ?sort=price
  → Ranked list optimized for decision-making

GET /recommend
  ?task=image-generation
  ?budget=50000
  → Single best recommendation with reasoning

GET /health/{endpoint_url}
  → Current status and recent quality metrics

GET /categories
  → List all categories with endpoint counts

GET /price-history/{id}
  ?days=30
  → Historical pricing data
```

### 5. MCP Server Integration

**What:** Expose intelligence layer as an MCP server so AI agents can query directly.

**MCP Tools:**
- `find_best_endpoint` — Given a task, return the optimal endpoint
- `compare_endpoints` — Compare options for a category
- `check_endpoint_health` — Get current status of a specific endpoint
- `get_price_history` — Historical pricing for an endpoint
- `list_categories` — Available service categories

**Implementation:**
- Use `@modelcontextprotocol/sdk`
- Wrap the REST API as MCP tools
- Publish to MCP registries

### 6. Dashboard UI (Optional for MVP)

**What:** Web interface for humans to explore the data.

**Features:**
- Browse endpoints by category
- View quality scores and trends
- Price comparison tables
- Status page showing ecosystem health

---

## Technical Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Infrastructure                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Ingestion    │    │ Quality      │    │ API Server   │  │
│  │ Worker       │───▶│ Monitor      │───▶│ + MCP        │  │
│  │              │    │              │    │              │  │
│  │ • Pull from  │    │ • Ping       │    │ • REST API   │  │
│  │   Bazaar API │    │   endpoints  │    │ • MCP Server │  │
│  │ • Every 10m  │    │ • Every 5m   │    │ • Dashboard  │  │
│  │ • Upsert to  │    │ • Log to DB  │    │              │  │
│  │   database   │    │ • Calc stats │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│          │                   │                   │          │
│          └───────────────────┴───────────────────┘          │
│                              │                               │
│                      ┌───────▼───────┐                      │
│                      │   Database    │                      │
│                      │  (Supabase)   │                      │
│                      │               │                      │
│                      │ • endpoints   │                      │
│                      │ • pings       │                      │
│                      │ • categories  │                      │
│                      │ • price_hist  │                      │
│                      └───────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘

External Dependencies:
├── Coinbase Bazaar API (https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources)
├── Individual x402 endpoints (for health checks)
└── Vercel (hosting + cron)
```

### Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Backend Framework** | Next.js 14 (App Router) | Full-stack, great DX, Vercel-native |
| **Database** | Supabase (PostgreSQL) | Generous free tier, real-time, good DX |
| **Cron Jobs** | Vercel Cron | Simple, integrated, free tier available |
| **MCP Server** | TypeScript + `@modelcontextprotocol/sdk` | Standard MCP implementation |
| **HTTP Client** | `fetch` or `axios` | For Bazaar ingestion and health checks |
| **Hosting** | Vercel | Free tier sufficient for MVP |
| **Optional: Dashboard** | React + Tailwind + shadcn/ui | Clean, fast to build |

### Database Schema

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
  ('llm-inference', 'LLM Inference', 'Chat completions and text generation', '🤖'),
  ('image-generation', 'Image Generation', 'Text-to-image and image editing', '🎨'),
  ('data-feeds', 'Data Feeds', 'Crypto prices, news, weather', '📊'),
  ('security', 'Security', 'Wallet verification, contract scanning', '🔒'),
  ('search', 'Search', 'Web search, social media queries', '🔍'),
  ('utilities', 'Utilities', 'QR codes, URL tools, etc.', '🔧'),
  ('defi', 'DeFi', 'Pool data, trading signals, yields', '💰'),
  ('social', 'Social', 'Twitter/X, Farcaster data', '📱');
```

---

## Implementation Tasks

### Phase 1: Foundation (Week 1-2)

#### 1.1 Project Setup
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Set up Supabase project and connect
- [ ] Configure Vercel deployment
- [ ] Set up environment variables
- [ ] Create database schema (run migrations)

#### 1.2 Bazaar Ingestion
- [ ] Create ingestion worker (`/api/cron/ingest`)
- [ ] Fetch from `https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources`
- [ ] Parse and upsert endpoints to database
- [ ] Handle pagination if needed
- [ ] Set up Vercel Cron (every 10 minutes)
- [ ] Log ingestion stats

#### 1.3 Quality Monitor
- [ ] Create health check worker (`/api/cron/health-check`)
- [ ] Implement endpoint pinging logic
- [ ] Handle timeouts gracefully (5s timeout)
- [ ] Store ping results in `pings` table
- [ ] Calculate rolling quality metrics
- [ ] Update `endpoints` table with computed stats
- [ ] Set up Vercel Cron (every 5 minutes, batched)

### Phase 2: API Layer (Week 2-3)

#### 2.1 REST API Endpoints
- [ ] `GET /api/endpoints` — List with filtering/sorting
- [ ] `GET /api/endpoints/[id]` — Single endpoint details
- [ ] `GET /api/compare` — Category comparison
- [ ] `GET /api/recommend` — Best endpoint for task
- [ ] `GET /api/health/[url]` — Endpoint health check
- [ ] `GET /api/categories` — List categories
- [ ] `GET /api/price-history/[id]` — Historical prices

#### 2.2 Category Classification
- [ ] Build auto-classifier based on description keywords
- [ ] Create manual override system
- [ ] Implement category assignment on ingestion
- [ ] Add tag extraction logic

#### 2.3 Price Normalization
- [ ] Identify endpoint types that can be normalized
- [ ] Build normalization logic for LLM endpoints
- [ ] Store normalized prices in JSONB field
- [ ] Create daily price snapshot job

### Phase 3: MCP Server (Week 3-4)

#### 3.1 MCP Implementation
- [ ] Set up MCP server package structure
- [ ] Implement `find_best_endpoint` tool
- [ ] Implement `compare_endpoints` tool
- [ ] Implement `check_endpoint_health` tool
- [ ] Implement `get_price_history` tool
- [ ] Implement `list_categories` tool
- [ ] Test with Claude Desktop

#### 3.2 MCP Distribution
- [ ] Create npm package
- [ ] Write MCP server documentation
- [ ] Add to MCP registries (if applicable)
- [ ] Create example usage scripts

### Phase 4: Polish & Launch (Week 4-5)

#### 4.1 Dashboard (Optional)
- [ ] Build category browse page
- [ ] Build endpoint detail page
- [ ] Build comparison view
- [ ] Build status/health overview

#### 4.2 Monetization Setup
- [ ] Implement x402 payment for API access (meta!)
- [ ] Set up rate limiting for free tier
- [ ] Create pricing tiers

#### 4.3 Documentation & Launch
- [ ] Write API documentation
- [ ] Create getting started guide
- [ ] Record demo video
- [ ] Announce on Twitter/X
- [ ] Post to relevant communities

---

## Monetization Strategy

### Revenue Streams

| Model | Description | Timeline |
|-------|-------------|----------|
| **x402-native API** | Charge micropayments per API call using x402 itself | Day 1 |
| **Freemium tiers** | Free: 100 calls/day, Pro: unlimited | Day 1 |
| **Premium data** | Historical analytics, custom alerts | Month 2+ |
| **Featured listings** | Providers pay for visibility | Month 3+ |
| **Affiliate/referral** | Rev-share with providers | Month 3+ |

### Suggested Pricing

- **Free tier:** 100 API calls/day, 7-day history
- **Pro tier:** $20/month or 20 USDC — unlimited calls, 90-day history, alerts
- **x402 per-call:** $0.001 per request (alternative to subscription)

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Bazaar API changes | Medium | High | Abstract ingestion layer, monitor for changes |
| Endpoint ping rate limits | Low | Medium | Implement backoff, respect robots.txt |
| Database scaling | Low | Medium | Supabase scales well, can upgrade tier |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Coinbase adds quality metrics to Bazaar | Medium | High | Move fast, build community, add unique features |
| x402 ecosystem doesn't grow | Low | High | Ecosystem is actively promoted by Coinbase + Solana |
| Low adoption | Medium | Medium | Focus on MCP integration for agent-native distribution |

---

## Success Metrics

### MVP Success (Month 1)
- [ ] 100% of Bazaar endpoints indexed
- [ ] Quality data for 30+ days
- [ ] MCP server functional and published
- [ ] 10+ unique users/agents

### Growth Success (Month 3)
- [ ] 1,000+ API calls/day
- [ ] Featured in x402 ecosystem resources
- [ ] Revenue > $100/month
- [ ] Community contributions (category suggestions, etc.)

### Expansion Success (Month 6+)
- [ ] Budget Controller beta launched
- [ ] 50+ wallets with spend tracking enabled
- [ ] Enterprise pilot customer
- [ ] Revenue > $1,000/month

---

## Phase 5: Agent Budget Controller (Future Expansion)

Once the Intelligence Layer has users and revenue, the natural expansion is to help agents **control spending**, not just **find endpoints**. This positions the product as the complete x402 agent infrastructure layer.

### The Problem This Solves

From the research:
> "An agent paying for an API call needs USDC in a hot wallet: custodying keys, managing balances, handling risk. For developers, it is manageable, but for enterprises deploying agent fleets, it becomes a compliance nightmare."

The pain point isn't wallet creation — it's **granular spending control**:
- How much can my agent spend per day?
- Can I cap individual transactions?
- Can I whitelist only x402 endpoints (not arbitrary addresses)?
- Can I auto-approve small payments but require human sign-off for large ones?

### What the Budget Controller Does

A policy enforcement layer between an agent and its wallet:

```
Agent wants to pay $0.05 for an API call
         ↓
Budget Controller checks:
  - Is this an x402 payment? ✓
  - Is $0.05 under per-tx limit? ✓
  - Is recipient a known x402 endpoint? ✓ (via Intelligence Layer!)
  - Is total daily spend under $10 cap? ✓
         ↓
Auto-approve and sign transaction
         ↓
Log transaction for reporting
```

### Why This Fits as an Add-On

The Intelligence Layer creates a natural foundation:

| Intelligence Layer Provides | Budget Controller Uses |
|----------------------------|----------------------|
| Registry of known x402 endpoints | Whitelist for allowed recipients |
| Price data per endpoint | Sanity checks ("this endpoint usually charges $0.01, why is it asking for $1?") |
| Quality scores | Policy rules ("only pay endpoints with >95% uptime") |
| Historical spending data | Budget tracking and alerts |

**The combination is powerful:** "We help you find the best endpoints AND ensure your agents don't overspend on them."

### Implementation Options

#### Option A: Off-Chain Signing Service (Easier)
- Agent sends payment requests to your service
- Service checks policies, signs if approved, rejects if not
- You hold a hot wallet key or use Turnkey-style delegated signing
- **Pros:** Faster to build, no Solana program needed
- **Cons:** Centralized, trust required, single point of failure

#### Option B: On-Chain Policy Program (Harder, Better)
- Solana program that enforces policies before signing
- Could integrate with Squads as a "policy plugin"
- **Pros:** Trustless, composable, no custody
- **Cons:** Complex to build, needs auditing

#### Option C: Hybrid
- Off-chain policy checking + on-chain spending limits via Squads
- Use Squads v4 spending limits as the enforcement layer
- Your service just manages the policies and integrates with their SDK
- **Pros:** Leverages existing audited infrastructure
- **Cons:** Dependent on Squads

### Suggested Approach

Start with **Option C (Hybrid)**:
1. Build a dashboard for managing x402 spending policies
2. Integrate with Squads SDK to set spending limits programmatically
3. Use Intelligence Layer data to suggest policies ("based on your usage, we recommend a $5/day limit")
4. Add spend tracking and alerts

This avoids building security-critical infrastructure from scratch while still owning the UX and x402-specific logic.

### Budget Controller Features

#### 5.1 Spend Tracking (Phase 5a - Week 6-7)
- [ ] Track all x402 payments made by connected wallets
- [ ] Dashboard showing daily/weekly/monthly spend
- [ ] Breakdown by endpoint, category, agent
- [ ] Export for accounting/compliance

#### 5.2 Policy Management (Phase 5b - Week 8-9)
- [ ] Define spending policies via UI
- [ ] Policy types: daily cap, per-tx limit, whitelist, category restrictions
- [ ] Connect policies to Squads spending limits
- [ ] Alert when approaching limits

#### 5.3 Auto-Approval Engine (Phase 5c - Week 10+)
- [ ] MCP tool for agents to request payment approval
- [ ] Automatic approval for payments within policy
- [ ] Human-in-the-loop for payments exceeding policy
- [ ] Rejection with explanation for blocked payments

### Budget Controller Monetization

| Model | Description |
|-------|-------------|
| **Per-wallet fee** | $5/month per managed wallet |
| **Percentage of spend** | 0.1% of x402 payments processed through policies |
| **Enterprise tier** | Custom policies, SLAs, dedicated support |
| **Audit reports** | Compliance-ready spending reports for enterprises |

### Why Wait?

Building the Budget Controller now would be premature:
1. **Market timing** — Enterprise agent deployments are still early
2. **Complexity** — Security-critical code needs careful design
3. **Dependencies** — Better to build on Squads/Crossmint than compete
4. **Validation** — Intelligence Layer users will tell you exactly what spending controls they need

Ship the Intelligence Layer first, gather feedback, then build the Budget Controller based on real demand.

---

## Other Future Expansion Ideas

1. **Automated Failover Service** — Proxy layer that automatically routes to backup if primary fails

2. **Provider Analytics Dashboard** — Help endpoint providers understand their quality vs. competitors

3. **Prediction Market** — Bet on endpoint uptime/reliability

4. **Quality Certification** — "x402 Verified" badge for consistently high-quality endpoints

5. **Agent Wallet Provisioning** — Partner with Crossmint/Squads to offer one-click wallet setup for new agents (not a custom wallet protocol, just a streamlined integration)

---

## Resources & References

### x402 Protocol
- Protocol spec: https://github.com/coinbase/x402
- Coinbase docs: https://docs.cdp.coinbase.com/x402/welcome
- Bazaar docs: https://docs.cdp.coinbase.com/x402/bazaar
- Solana x402 guide: https://solana.com/developers/guides/getstarted/intro-to-x402

### Bazaar API
- Discovery endpoint: `https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources`
- Returns JSON array of endpoints with pricing, schemas, metadata

### MCP (Model Context Protocol)
- Spec: https://modelcontextprotocol.io
- TypeScript SDK: `@modelcontextprotocol/sdk`

### Existing Players (for reference)
- x402apis.io — Registry/marketplace
- x402labs.cloud — RPC aggregator
- t54.ai — Security scoring

---

## Getting Started

To begin development:

```bash
# Clone and setup
npx create-next-app@latest x402-intel --typescript --tailwind --app
cd x402-intel

# Install dependencies
npm install @supabase/supabase-js @modelcontextprotocol/sdk

# Set up environment
cp .env.example .env.local
# Add: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY

# Run locally
npm run dev
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-24 | Initial specification |
| 1.1 | 2024-12-24 | Added Phase 5: Agent Budget Controller as future expansion |

---

*This document is maintained by Tonbi Studio. For questions or contributions, contact the team.*

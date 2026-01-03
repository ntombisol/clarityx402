# Clarityx402

**The quality and price intelligence layer for x402** - helping agents find the best endpoint for any task, not just any endpoint.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is this?

[x402](https://github.com/coinbase/x402) is a payment protocol for the internet, enabling pay-per-call APIs for AI agents. But with hundreds of endpoints available, how do you know which one to use?

**Clarityx402** indexes all x402 endpoints and tracks:
- **Uptime** - Is it actually working?
- **Latency** - How fast is it?
- **Price** - What does it cost?
- **Category** - What does it do?

Use it via the **web dashboard** or integrate with the **MCP server** for AI agents.

## Features

- **1,400+ endpoints indexed** from Coinbase Bazaar
- **Multi-chain support** - Base, Solana, Polygon, and more
- **Real-time health monitoring** - Pings every 5 minutes
- **Auto-categorization** - LLM, image generation, DeFi, etc.
- **MCP Server** - AI agents can query endpoint intelligence
- **REST API** - Programmatic access to all data

## Quick Start

### Prerequisites
- Node.js 18+
- [Supabase](https://supabase.com) project (free tier works)
- [CDP API keys](https://portal.cdp.coinbase.com/) from Coinbase Developer Platform

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/clarityx402.git
cd clarityx402
npm install
```

### Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# CDP API (for Bazaar access)
CDP_API_KEY_NAME=your-key-name
CDP_API_KEY_SECRET=your-key-secret

# Cron protection
CRON_SECRET=your-random-secret
```

### Database Setup

Run these migrations in your Supabase SQL Editor (in order):
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_add_source_column.sql`
3. `supabase/migrations/003_fix_error_rate_precision.sql`

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Initial Data Load

```bash
# Fetch all endpoints from Bazaar (takes ~5 min)
curl "http://localhost:3000/api/cron/ingest?maxPages=15"

# Run health checks
curl "http://localhost:3000/api/cron/health-check"
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/endpoints` | List endpoints with filters |
| `GET /api/endpoints/[id]` | Single endpoint details |
| `GET /api/categories` | List categories |
| `GET /api/compare?category=` | Compare endpoints in category |
| `GET /api/recommend?task=` | Get best endpoint for task |
| `GET /api/health/[url]` | Check endpoint health |

### Example

```bash
# Get top LLM endpoints by uptime
curl "http://localhost:3000/api/endpoints?category=llm-inference&sort=uptime"
```

## MCP Server

The MCP server lets AI agents query endpoint intelligence.

```bash
cd mcp-server
npm install
npm run build
```

Add to Claude Desktop config:
```json
{
  "mcpServers": {
    "clarityx402": {
      "command": "node",
      "args": ["path/to/mcp-server/dist/index.js"],
      "env": {
        "CLARITYX402_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

### Available Tools
- `find_best_endpoint` - Best endpoint for a task/budget
- `compare_endpoints` - Compare category options
- `check_endpoint_health` - Current status
- `list_categories` - Available categories

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

Cron jobs run automatically:
- **Ingest**: Every 10 minutes
- **Health check**: Every 5 minutes

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Key areas for contribution:
- Add new data sources (other chains/registries)
- Improve the category classifier
- UI/UX improvements
- Bug fixes

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Data Sources                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   Bazaar    │  │ x402apis.io │  │   (more)    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
└─────────┼────────────────┼────────────────┼─────────┘
          └────────────────┼────────────────┘
                           ▼
                  ┌─────────────────┐
                  │   Aggregator    │
                  │  (deduplicate)  │
                  └────────┬────────┘
                           ▼
                  ┌─────────────────┐
                  │    Supabase     │
                  │   (PostgreSQL)  │
                  └────────┬────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌────────────┐   ┌────────────┐   ┌────────────┐
   │  REST API  │   │ Dashboard  │   │ MCP Server │
   └────────────┘   └────────────┘   └────────────┘
```

## License

MIT - see [LICENSE](LICENSE)

## Links

- [x402 Protocol](https://github.com/coinbase/x402)
- [Coinbase Bazaar](https://docs.cdp.coinbase.com/x402/bazaar)
- [MCP Protocol](https://modelcontextprotocol.io)

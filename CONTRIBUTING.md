# Contributing to Clarityx402

Thanks for your interest in contributing! Clarityx402 is the quality and price intelligence layer for x402 endpoints.

## Ways to Contribute

### Add a Data Source
We want to index x402 endpoints from all chains. To add a new source:

1. Create a client in `src/lib/sources/` implementing the `DataSource` interface:
```typescript
import type { DataSource, SourceEndpoint } from "./types";

export class MySourceClient implements DataSource {
  name = "my-source";

  async fetchEndpoints(maxPages?: number): Promise<SourceEndpoint[]> {
    // Fetch and transform endpoints
  }
}
```

2. Add it to the aggregator in `src/lib/sources/aggregator.ts`
3. Submit a PR with documentation

### Improve the Classifier
The auto-categorizer in `src/lib/classifier/index.ts` uses keyword matching. Help us:
- Add keywords for existing categories
- Propose new categories
- Improve description parsing

### UI Improvements
- Add charts for uptime/latency trends
- Improve mobile responsiveness
- Add dark mode toggle

### Bug Fixes
Check the issues tab for known bugs.

## Development Setup

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)
- CDP API keys from [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)

### Local Development

1. Clone and install:
```bash
git clone https://github.com/YOUR_USERNAME/clarityx402.git
cd clarityx402
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

3. Run database migrations in Supabase SQL Editor:
```sql
-- Run files in order from supabase/migrations/
```

4. Start the dev server:
```bash
npm run dev
```

5. Trigger initial data ingestion:
```bash
curl http://localhost:3000/api/cron/ingest?maxPages=15
```

### Running Tests
```bash
npm run test        # Unit tests
npm run build       # Type checking
```

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Make your changes with clear commit messages
3. Ensure `npm run build` passes
4. Submit a PR with a description of changes

## Code Style

- TypeScript for all new code
- Use existing patterns (check similar files)
- No unnecessary dependencies
- Keep components focused and small

## Questions?

Open an issue or start a discussion. We're happy to help!

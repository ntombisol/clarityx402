# Solana DeFi Data Hub - x402 API Specification

## Overview

A Solana-native x402 API that provides unified DeFi data (prices, swap quotes, pool data, yields, portfolio) with pay-per-query micropayments in USDC on Solana. No API keys, no subscriptions.

**Target Users**: AI agents, trading bots, DeFi developers, vibe coders building on Solana

**Competitive Positioning**: "Elsa x402 but for Solana" - Elsa exists on Base, nothing comparable exists natively on Solana.

---

## Tech Stack

```
Framework:      Hono (lightweight, fast) or Express
Runtime:        Node.js / Bun
x402 SDK:       @x402/svm
Facilitator:    PayAI (Solana-first, handles tx fees)
Payment Token:  USDC on Solana mainnet
Hosting:        Railway / Render / Fly.io
Caching:        Redis (Upstash free tier)
```

### Key Dependencies

```json
{
  "dependencies": {
    "hono": "^4.0.0",
    "@x402/svm": "latest",
    "@solana/web3.js": "^1.95.0",
    "ioredis": "^5.0.0"
  }
}
```

---

## API Endpoints

### Tier 1: Core (MVP)

| Endpoint | Price | Description |
|----------|-------|-------------|
| `GET /v1/price/{mint}` | $0.001 | Current token price with liquidity |
| `POST /v1/prices/batch` | $0.002 | Batch price lookup (up to 50 tokens) |
| `POST /v1/swap/quote` | $0.002 | Best swap route via Jupiter |
| `GET /v1/pools/{address}` | $0.002 | Liquidity pool details |

### Tier 2: Advanced

| Endpoint | Price | Description |
|----------|-------|-------------|
| `GET /v1/yields/top` | $0.005 | Top yield opportunities across protocols |
| `GET /v1/portfolio/{wallet}` | $0.01 | Wallet DeFi positions and balances |
| `GET /v1/token/{mint}/info` | $0.001 | Token metadata + holder stats |

---

## Endpoint Specifications

### GET /v1/price/{mint}

Get current price for a single token.

**Parameters:**
- `mint` (path, required): Token mint address

**Response:**
```json
{
  "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "symbol": "USDC",
  "name": "USD Coin",
  "price_usd": 1.0001,
  "price_sol": 0.00523,
  "liquidity_usd": 125000000,
  "volume_24h_usd": 850000000,
  "price_change_24h": 0.01,
  "last_updated": "2026-01-04T12:00:00Z"
}
```

**Data Source:** Birdeye API or Jupiter Price API

---

### POST /v1/prices/batch

Get prices for multiple tokens in one call.

**Request Body:**
```json
{
  "mints": [
    "So11111111111111111111111111111111111111112",
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
  ]
}
```

**Response:**
```json
{
  "prices": [
    {
      "mint": "So11111111111111111111111111111111111111112",
      "symbol": "SOL",
      "price_usd": 190.50,
      "liquidity_usd": 500000000
    },
    {
      "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "symbol": "USDC",
      "price_usd": 1.0001,
      "liquidity_usd": 125000000
    },
    {
      "mint": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      "symbol": "BONK",
      "price_usd": 0.00002534,
      "liquidity_usd": 15000000
    }
  ],
  "count": 3,
  "last_updated": "2026-01-04T12:00:00Z"
}
```

**Limits:** Max 50 tokens per request

**Data Source:** Birdeye Batch API

---

### POST /v1/swap/quote

Get optimal swap route via Jupiter aggregation.

**Request Body:**
```json
{
  "input_mint": "So11111111111111111111111111111111111111112",
  "output_mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": "1000000000",
  "slippage_bps": 50
}
```

**Response:**
```json
{
  "input_mint": "So11111111111111111111111111111111111111112",
  "output_mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "input_amount": "1000000000",
  "output_amount": "190123456",
  "output_amount_usd": 190.12,
  "price_impact_pct": 0.05,
  "slippage_bps": 50,
  "route": [
    {
      "dex": "Raydium",
      "pool": "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2",
      "input_mint": "So11111111111111111111111111111111111111112",
      "output_mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "percent": 100
    }
  ],
  "fees": {
    "platform_fee_bps": 0,
    "lp_fee_bps": 25
  }
}
```

**Data Source:** Jupiter Quote API (https://quote-api.jup.ag/v6/quote)

---

### GET /v1/pools/{address}

Get liquidity pool details.

**Parameters:**
- `address` (path, required): Pool address

**Response:**
```json
{
  "address": "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2",
  "dex": "Raydium",
  "type": "AMM",
  "token_a": {
    "mint": "So11111111111111111111111111111111111111112",
    "symbol": "SOL",
    "reserve": 125000.5,
    "reserve_usd": 23812595
  },
  "token_b": {
    "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "symbol": "USDC",
    "reserve": 23850000,
    "reserve_usd": 23850000
  },
  "tvl_usd": 47662595,
  "volume_24h_usd": 15000000,
  "fee_rate_bps": 25,
  "apy_24h": 45.2,
  "last_updated": "2026-01-04T12:00:00Z"
}
```

**Data Source:** Birdeye Pool API or direct on-chain via Helius

---

### GET /v1/yields/top

Get top yield opportunities across Solana DeFi.

**Query Parameters:**
- `limit` (optional): Number of results (default: 20, max: 100)
- `protocol` (optional): Filter by protocol (kamino, marginfi, drift, etc.)
- `min_tvl` (optional): Minimum TVL in USD

**Response:**
```json
{
  "yields": [
    {
      "protocol": "Kamino",
      "product": "JLP Vault",
      "asset": "JLP",
      "apy": 42.5,
      "apy_base": 12.0,
      "apy_reward": 30.5,
      "tvl_usd": 150000000,
      "risk_level": "medium"
    },
    {
      "protocol": "Marginfi",
      "product": "Lending",
      "asset": "SOL",
      "apy": 8.2,
      "apy_base": 8.2,
      "apy_reward": 0,
      "tvl_usd": 500000000,
      "risk_level": "low"
    }
  ],
  "count": 20,
  "last_updated": "2026-01-04T12:00:00Z"
}
```

**Data Source:** DeFiLlama Yields API + protocol-specific APIs

---

### GET /v1/portfolio/{wallet}

Get wallet's DeFi positions and token balances.

**Parameters:**
- `wallet` (path, required): Wallet address

**Response:**
```json
{
  "wallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "total_value_usd": 15420.50,
  "tokens": [
    {
      "mint": "So11111111111111111111111111111111111111112",
      "symbol": "SOL",
      "balance": 50.5,
      "value_usd": 9620.25
    },
    {
      "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "symbol": "USDC",
      "balance": 5000,
      "value_usd": 5000
    }
  ],
  "defi_positions": [
    {
      "protocol": "Marinade",
      "type": "staking",
      "asset": "mSOL",
      "deposited": 5.2,
      "value_usd": 1050.25,
      "apy": 7.8
    }
  ],
  "last_updated": "2026-01-04T12:00:00Z"
}
```

**Data Source:** Helius DAS API + protocol position parsing

---

## x402 Integration

### Server Setup (Hono Example)

```typescript
import { Hono } from 'hono';
import { paymentMiddleware, Network } from '@x402/svm';

const app = new Hono();

// x402 configuration
const x402Config = {
  network: Network.MAINNET,
  facilitatorUrl: 'https://facilitator.payai.network',
  payTo: 'YOUR_USDC_WALLET_ADDRESS',
};

// Pricing per endpoint
const pricing = {
  '/v1/price/:mint': 0.001,
  '/v1/prices/batch': 0.002,
  '/v1/swap/quote': 0.002,
  '/v1/pools/:address': 0.002,
  '/v1/yields/top': 0.005,
  '/v1/portfolio/:wallet': 0.01,
};

// Apply x402 middleware to all /v1 routes
app.use('/v1/*', async (c, next) => {
  const path = c.req.path;
  const price = pricing[path] || 0.001;
  
  return paymentMiddleware({
    ...x402Config,
    amount: price,
  })(c, next);
});

// Example endpoint
app.get('/v1/price/:mint', async (c) => {
  const mint = c.req.param('mint');
  const priceData = await fetchPrice(mint);
  return c.json(priceData);
});

export default app;
```

### Payment Flow

```
1. Client sends request to /v1/price/{mint}
2. Server returns 402 with PaymentRequirements:
   {
     "scheme": "exact",
     "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
     "maxAmountRequired": "1000",  // 0.001 USDC in base units
     "resource": "/v1/price/{mint}",
     "payTo": "YOUR_WALLET",
     "facilitator": "https://facilitator.payai.network"
   }
3. Client creates USDC transfer, gets X-PAYMENT header from facilitator
4. Client retries request with X-PAYMENT header
5. Server verifies payment via facilitator
6. Server returns price data
```

---

## Data Sources

### Primary APIs

| Source | Used For | Cost | Rate Limit |
|--------|----------|------|------------|
| **Jupiter API** | Swap quotes | Free | 600/min |
| **Birdeye API** | Prices, pools, tokens | Free tier / $99/mo | 100/min free |
| **Helius DAS** | Portfolio, token balances | Free tier / $49/mo | 50/sec free |
| **DeFiLlama** | Yields | Free | 300/5min |

### Backup/Fallback APIs

| Source | Used For | Notes |
|--------|----------|-------|
| **Jupiter Price API** | Price fallback | Less data than Birdeye |
| **Solana RPC** | Direct on-chain | For custom parsing |

---

## Caching Strategy

```typescript
const CACHE_TTL = {
  price: 5,           // 5 seconds - prices change fast
  prices_batch: 5,
  swap_quote: 0,      // No cache - must be fresh
  pools: 30,          // 30 seconds
  yields: 300,        // 5 minutes
  portfolio: 60,      // 1 minute
  token_info: 3600,   // 1 hour - rarely changes
};
```

### Redis Keys

```
price:{mint} -> JSON price data
pools:{address} -> JSON pool data
yields:top:{limit} -> JSON yields array
portfolio:{wallet} -> JSON portfolio data
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "INVALID_MINT",
    "message": "Token mint address is invalid",
    "details": {
      "mint": "invalid-address"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_MINT` | 400 | Invalid token mint address |
| `INVALID_POOL` | 400 | Invalid pool address |
| `TOKEN_NOT_FOUND` | 404 | Token not found |
| `POOL_NOT_FOUND` | 404 | Pool not found |
| `WALLET_NOT_FOUND` | 404 | Wallet has no data |
| `UPSTREAM_ERROR` | 502 | Data source unavailable |
| `RATE_LIMITED` | 429 | Too many requests |
| `PAYMENT_REQUIRED` | 402 | x402 payment needed |
| `PAYMENT_INVALID` | 402 | Payment verification failed |

---

## Project Structure

```
solana-defi-hub/
├── src/
│   ├── index.ts              # Entry point, Hono app
│   ├── middleware/
│   │   ├── x402.ts           # x402 payment middleware
│   │   └── cache.ts          # Redis caching middleware
│   ├── routes/
│   │   ├── price.ts          # /v1/price endpoints
│   │   ├── swap.ts           # /v1/swap endpoints
│   │   ├── pools.ts          # /v1/pools endpoints
│   │   ├── yields.ts         # /v1/yields endpoints
│   │   └── portfolio.ts      # /v1/portfolio endpoints
│   ├── services/
│   │   ├── jupiter.ts        # Jupiter API client
│   │   ├── birdeye.ts        # Birdeye API client
│   │   ├── helius.ts         # Helius API client
│   │   └── defillama.ts      # DeFiLlama API client
│   ├── utils/
│   │   ├── cache.ts          # Redis utilities
│   │   └── validation.ts     # Input validation
│   └── types/
│       └── index.ts          # TypeScript types
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## Environment Variables

```bash
# Required
PAYTO_WALLET=           # Your USDC wallet for receiving payments
SOLANA_RPC_URL=         # Helius or other RPC

# API Keys (optional for higher limits)
BIRDEYE_API_KEY=        # Birdeye API key
HELIUS_API_KEY=         # Helius API key

# Redis (optional, for caching)
REDIS_URL=              # Upstash or other Redis

# Server
PORT=3000
NODE_ENV=production
```

---

## Implementation Phases

### Phase 1: MVP (Week 1)
- [ ] Project setup (Hono, TypeScript, x402)
- [ ] PayAI facilitator integration
- [ ] `/v1/price/{mint}` endpoint
- [ ] `/v1/swap/quote` endpoint
- [ ] Basic error handling
- [ ] Deploy to Railway/Render

### Phase 2: Core Features (Week 2)
- [ ] `/v1/prices/batch` endpoint
- [ ] `/v1/pools/{address}` endpoint
- [ ] Redis caching layer
- [ ] Rate limiting
- [ ] Logging and monitoring

### Phase 3: Advanced (Week 3)
- [ ] `/v1/yields/top` endpoint
- [ ] `/v1/portfolio/{wallet}` endpoint
- [ ] Landing page
- [ ] API documentation
- [ ] x402scan listing submission

### Phase 4: Launch (Week 3-4)
- [ ] Production hardening
- [ ] CT announcement
- [ ] Solana x402 hackathon submission
- [ ] Community feedback iteration

---

## Testing

### Manual Testing

```bash
# Test without payment (should return 402)
curl https://your-api.com/v1/price/So11111111111111111111111111111111111111112

# Test with x402 payment
# Use x402 CLI or browser extension to generate payment header
curl -H "X-PAYMENT: eyJ..." https://your-api.com/v1/price/So11111111111111111111111111111111111111112
```

### Integration Tests

```typescript
describe('Price Endpoint', () => {
  it('returns 402 without payment', async () => {
    const res = await app.request('/v1/price/So11111111111111111111111111111111111111112');
    expect(res.status).toBe(402);
  });

  it('returns price data with valid payment', async () => {
    const payment = await mockPayment();
    const res = await app.request('/v1/price/So11111111111111111111111111111111111111112', {
      headers: { 'X-PAYMENT': payment }
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.price_usd).toBeDefined();
  });
});
```

---

## Cost Projections

### Monthly Costs

| Tier | Queries/day | Revenue | API Costs | Hosting | Net |
|------|-------------|---------|-----------|---------|-----|
| MVP | 500 | $15-30/mo | $0 | $0 | $15-30 |
| Growth | 5,000 | $150-300/mo | $50 | $20 | $80-230 |
| Scale | 50,000 | $1,500-3,000/mo | $150 | $50 | $1,300-2,800 |

### Breakeven

~2,000 queries/day covers Birdeye + Helius paid tiers ($150/mo)

---

## Go-to-Market

1. **Soft launch**: Deploy, test with own agents
2. **x402scan listing**: Submit to ecosystem directory
3. **CT announcement**: Demo video showing agent using API
4. **Hackathon**: Submit to Solana x402 hackathon
5. **Developer outreach**: Share in Solana dev communities, AI agent builders

---

## Future Enhancements

- WebSocket streaming for real-time prices
- MCP server for Claude Desktop integration
- Pump.fun specific endpoints (new launches, bonding curves)
- Historical data endpoints
- Custom alerts/webhooks
- Multi-token payment support (SOL, memecoins)

---

## References

- [x402 Protocol Spec](https://www.x402.org/)
- [PayAI Facilitator Docs](https://payai.network/docs)
- [Jupiter API Docs](https://station.jup.ag/docs/apis/swap-api)
- [Birdeye API Docs](https://docs.birdeye.so/)
- [Helius API Docs](https://docs.helius.dev/)
- [Solana x402 Guide](https://solana.com/developers/guides/getstarted/intro-to-x402)

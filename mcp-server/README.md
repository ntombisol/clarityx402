# clarityx402-mcp

MCP (Model Context Protocol) server for [Clarityx402](https://clarityx402.vercel.app) — the open source price and quality intelligence layer for x402 endpoints.

Give your AI agents the ability to find the best x402 endpoint for any task based on price, uptime, and latency.

## Compatibility

Works with any MCP-compatible AI client:

- **Claude Desktop** — Native support
- **Cursor IDE** — Built-in MCP support
- **Continue** — VS Code extension
- **Cline** — VS Code extension
- **Custom clients** — Any app using the MCP SDK

## Installation

```bash
npm install -g clarityx402-mcp
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "clarityx402": {
      "command": "clarityx402-mcp"
    }
  }
}
```

Or use npx (no installation required):

```json
{
  "mcpServers": {
    "clarityx402": {
      "command": "npx",
      "args": ["-y", "clarityx402-mcp"]
    }
  }
}
```

## Available Tools

### `find_best_endpoint`

Find the optimal x402 endpoint for a given task.

```
Parameters:
- task (required): Category like "llm-inference", "image-generation", "search"
- budget (optional): Maximum price in micro USDC (1 USDC = 1,000,000)
- min_uptime (optional): Minimum uptime percentage (default: 90)
```

### `compare_endpoints`

Compare endpoints within a category with quality scores.

```
Parameters:
- category (required): Category to compare
- sort (optional): "score", "price", "uptime", or "latency"
```

### `check_endpoint_health`

Get current health status of a specific endpoint.

```
Parameters:
- url (required): Full URL of the x402 endpoint
```

### `get_price_history`

Historical pricing data for trend analysis.

```
Parameters:
- endpoint_id (required): Endpoint ID
- days (optional): Days of history (default: 30, max: 365)
```

### `list_categories`

List all available endpoint categories with counts.

## Example Prompts

Once configured, you can ask Claude:

- *"Find me the best LLM inference endpoint under $0.01 per request"*
- *"Compare all image generation endpoints by uptime"*
- *"Check if the endpoint at api.example.com/v1/chat is healthy"*
- *"What categories of x402 endpoints are available?"*

## Configuration

By default, the server connects to `https://clarityx402.vercel.app`. To use a different API:

```json
{
  "mcpServers": {
    "clarityx402": {
      "command": "clarityx402-mcp",
      "env": {
        "CLARITYX402_API_URL": "https://your-instance.com"
      }
    }
  }
}
```

## Links

- [Dashboard](https://clarityx402.vercel.app)
- [Documentation](https://clarityx402.vercel.app/mcp)
- [GitHub](https://github.com/tonbistudio/clarityx402)
- [x402 Protocol](https://github.com/coinbase/x402)

## License

MIT

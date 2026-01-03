#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ClarityApiClient } from "./api-client.js";

const apiClient = new ClarityApiClient(process.env.CLARITYX402_API_URL);

const server = new Server(
  {
    name: "clarityx402",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "find_best_endpoint",
        description:
          "Find the best x402 endpoint for a given task. Returns the recommended endpoint based on quality score, price, and uptime.",
        inputSchema: {
          type: "object" as const,
          properties: {
            task: {
              type: "string",
              description:
                "The task or category to find an endpoint for (e.g., 'llm-inference', 'image-generation', 'search')",
            },
            budget: {
              type: "number",
              description:
                "Maximum price in micro USDC (optional). 1 USDC = 1,000,000 micro USDC",
            },
            min_uptime: {
              type: "number",
              description:
                "Minimum required uptime percentage (default: 90)",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "compare_endpoints",
        description:
          "Compare x402 endpoints within a category. Returns a ranked list with quality scores.",
        inputSchema: {
          type: "object" as const,
          properties: {
            category: {
              type: "string",
              description:
                "Category to compare (e.g., 'llm-inference', 'image-generation', 'defi')",
            },
            sort: {
              type: "string",
              enum: ["score", "price", "uptime", "latency"],
              description: "How to sort the results (default: score)",
            },
          },
          required: ["category"],
        },
      },
      {
        name: "check_endpoint_health",
        description:
          "Get the current health status of a specific x402 endpoint by its URL.",
        inputSchema: {
          type: "object" as const,
          properties: {
            url: {
              type: "string",
              description: "The full URL of the x402 endpoint to check",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "get_price_history",
        description:
          "Get historical pricing data for an x402 endpoint. Useful for detecting price trends.",
        inputSchema: {
          type: "object" as const,
          properties: {
            endpoint_id: {
              type: "string",
              description: "The endpoint ID to get price history for",
            },
            days: {
              type: "number",
              description: "Number of days of history to retrieve (default: 30, max: 365)",
            },
          },
          required: ["endpoint_id"],
        },
      },
      {
        name: "list_categories",
        description:
          "List all available x402 endpoint categories with their endpoint counts.",
        inputSchema: {
          type: "object" as const,
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "find_best_endpoint": {
        const result = await apiClient.getRecommendation({
          task: args?.task as string,
          budget: args?.budget as number | undefined,
          min_uptime: args?.min_uptime as number | undefined,
        });

        if (!result.recommendation) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No endpoints found matching your criteria. Try adjusting your requirements.",
              },
            ],
          };
        }

        const { endpoint, reasoning } = result.recommendation;
        const priceUsd = endpoint.price_micro_usdc
          ? (endpoint.price_micro_usdc / 1000000).toFixed(6)
          : "N/A";

        let response = `## Best Endpoint Found\n\n`;
        response += `**URL:** ${endpoint.resource_url}\n`;
        response += `**Category:** ${endpoint.category || "Uncategorized"}\n`;
        response += `**Price:** $${priceUsd} per request\n`;
        response += `**Uptime (24h):** ${endpoint.uptime_24h || "N/A"}%\n`;
        response += `**Latency:** ${endpoint.avg_latency_ms || "N/A"}ms\n\n`;
        response += `### Why this endpoint?\n`;
        response += reasoning.map((r) => `- ${r}`).join("\n");

        if (result.alternatives.length > 0) {
          response += `\n\n### Alternatives\n`;
          for (const alt of result.alternatives) {
            const altPrice = alt.endpoint.price_micro_usdc
              ? (alt.endpoint.price_micro_usdc / 1000000).toFixed(6)
              : "N/A";
            response += `${alt.rank}. ${alt.endpoint.resource_url} - $${altPrice}, ${alt.endpoint.uptime_24h || "N/A"}% uptime\n`;
          }
        }

        return {
          content: [{ type: "text" as const, text: response }],
        };
      }

      case "compare_endpoints": {
        const result = await apiClient.compareEndpoints(
          args?.category as string,
          args?.sort as "score" | "price" | "uptime" | "latency" | undefined
        );

        if (result.endpoints.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No endpoints found in category: ${args?.category}`,
              },
            ],
          };
        }

        let response = `## ${result.category} Endpoints Comparison\n\n`;
        response += `| Rank | Endpoint | Price | Uptime | Latency | Score |\n`;
        response += `|------|----------|-------|--------|---------|-------|\n`;

        for (const ep of result.endpoints) {
          const priceUsd = ep.price_micro_usdc
            ? `$${(ep.price_micro_usdc / 1000000).toFixed(4)}`
            : "N/A";
          const host = new URL(ep.resource_url).hostname;
          response += `| ${ep.rank} | ${host} | ${priceUsd} | ${ep.uptime_24h || "N/A"}% | ${ep.avg_latency_ms || "N/A"}ms | ${ep.score} |\n`;
        }

        return {
          content: [{ type: "text" as const, text: response }],
        };
      }

      case "check_endpoint_health": {
        const result = await apiClient.checkHealth(args?.url as string);

        const statusEmoji =
          result.status === "operational"
            ? "🟢"
            : result.status === "degraded"
            ? "🟡"
            : result.status === "down"
            ? "🔴"
            : "⚪";

        let response = `## Endpoint Health: ${result.url}\n\n`;
        response += `**Status:** ${statusEmoji} ${result.status.toUpperCase()}\n`;
        response += `**Active:** ${result.isActive ? "Yes" : "No"}\n`;
        response += `**Last Seen:** ${result.lastSeen || "Never"}\n`;
        response += `**Consecutive Failures:** ${result.consecutiveFailures}\n\n`;
        response += `### Metrics\n`;
        response += `- Uptime (24h): ${result.metrics.uptime_24h || "N/A"}%\n`;
        response += `- Uptime (7d): ${result.metrics.uptime_7d || "N/A"}%\n`;
        response += `- Avg Latency: ${result.metrics.avg_latency_ms || "N/A"}ms\n`;
        response += `- P95 Latency: ${result.metrics.p95_latency_ms || "N/A"}ms\n`;
        response += `- Error Rate: ${result.metrics.error_rate || "N/A"}%\n`;

        return {
          content: [{ type: "text" as const, text: response }],
        };
      }

      case "get_price_history": {
        const result = await apiClient.getPriceHistory(
          args?.endpoint_id as string,
          args?.days as number | undefined
        );

        const trendEmoji =
          result.stats.trend === "up"
            ? "📈"
            : result.stats.trend === "down"
            ? "📉"
            : "➡️";

        let response = `## Price History: ${result.endpoint.url}\n\n`;
        response += `**Trend:** ${trendEmoji} ${result.stats.trend}\n`;
        response += `**Current:** $${(result.stats.avg / 1000000).toFixed(6)}\n`;
        response += `**Min:** $${(result.stats.min / 1000000).toFixed(6)}\n`;
        response += `**Max:** $${(result.stats.max / 1000000).toFixed(6)}\n\n`;

        if (result.history.length > 0) {
          response += `### Recent History\n`;
          for (const record of result.history.slice(0, 10)) {
            response += `- ${record.recorded_at}: $${(record.price_micro_usdc / 1000000).toFixed(6)}\n`;
          }
        }

        return {
          content: [{ type: "text" as const, text: response }],
        };
      }

      case "list_categories": {
        const result = await apiClient.listCategories();

        let response = `## x402 Endpoint Categories\n\n`;
        response += `**Total Endpoints:** ${result.summary.totalEndpoints}\n`;
        response += `**Total Categories:** ${result.summary.totalCategories}\n\n`;
        response += `| Category | Endpoints | Description |\n`;
        response += `|----------|-----------|-------------|\n`;

        for (const cat of result.categories) {
          response += `| ${cat.name} | ${cat.endpoint_count} | ${cat.description || "-"} |\n`;
        }

        return {
          content: [{ type: "text" as const, text: response }],
        };
      }

      default:
        return {
          content: [
            {
              type: "text" as const,
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Clarityx402 MCP Server running on stdio");
}

main().catch(console.error);

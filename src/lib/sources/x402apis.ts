// Client for x402apis.io registry API
// This is a Solana-focused x402 provider registry

import type { DataSource, SourceEndpoint } from "./types";

const X402APIS_REGISTRY_URL = process.env.X402APIS_REGISTRY_URL || "https://x402apis.io/api/providers";

interface X402ApisProvider {
  id?: string;
  name?: string;
  url?: string;
  endpoint?: string;
  description?: string;
  price?: number | string;
  network?: string;
  wallet?: string;
}

interface X402ApisResponse {
  providers: X402ApisProvider[];
  total: number;
  page: number;
  limit: number;
}

export class X402ApisClient implements DataSource {
  name = "x402apis";
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || X402APIS_REGISTRY_URL;
  }

  async fetchEndpoints(maxPages: number = 3): Promise<SourceEndpoint[]> {
    const allEndpoints: SourceEndpoint[] = [];
    let page = 1;
    let hasMore = true;
    let pagesLoaded = 0;

    while (hasMore && pagesLoaded < maxPages) {
      try {
        const url = new URL(this.baseUrl);
        url.searchParams.set("page", page.toString());
        url.searchParams.set("limit", "100");

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          console.error(`[x402apis] API error: ${response.status}`);
          break;
        }

        const data: X402ApisResponse = await response.json();

        if (!data.providers || data.providers.length === 0) {
          hasMore = false;
          break;
        }

        const endpoints = data.providers.map((provider) =>
          this.transformProvider(provider)
        );
        allEndpoints.push(...endpoints);

        // Check if there are more pages
        const totalPages = Math.ceil(data.total / data.limit);
        hasMore = page < totalPages;
        page++;
        pagesLoaded++;

        // Rate limiting
        if (hasMore) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error("[x402apis] Fetch error:", error);
        break;
      }
    }

    console.log(`[x402apis] Fetched ${allEndpoints.length} endpoints`);
    return allEndpoints;
  }

  private transformProvider(provider: X402ApisProvider): SourceEndpoint {
    // Parse price - might be in different formats
    let priceMicroUsdc: number | null = null;
    if (provider.price !== undefined) {
      const parsed =
        typeof provider.price === "number"
          ? provider.price
          : parseInt(provider.price, 10);
      if (!isNaN(parsed)) {
        priceMicroUsdc = parsed;
      }
    }

    return {
      resource_url: provider.url || provider.endpoint || "",
      description: provider.description || provider.name || null,
      price_micro_usdc: priceMicroUsdc,
      network: provider.network || "solana", // x402apis is Solana-focused
      pay_to_address: provider.wallet || null,
      source: "x402apis",
      raw_data: provider,
    };
  }
}

// Singleton instance
let x402ApisClient: X402ApisClient | null = null;

export function getX402ApisClient(): X402ApisClient {
  if (!x402ApisClient) {
    x402ApisClient = new X402ApisClient();
  }
  return x402ApisClient;
}

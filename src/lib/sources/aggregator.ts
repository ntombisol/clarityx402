// Aggregator that fetches from all x402 data sources and deduplicates

import type { DataSource, SourceEndpoint, SourceStats } from "./types";
import { getBazaarAdapter } from "./bazaar-adapter";
import { getX402ApisClient } from "./x402apis";

/**
 * Normalize URL for consistent storage and deduplication
 * - Lowercase the host
 * - Remove trailing slashes from path
 * - Keep query params and path intact
 */
export function normalizeResourceUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Normalize: lowercase host, remove trailing slash from path
    const normalizedPath = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${normalizedPath}${parsed.search}`;
  } catch {
    // If URL parsing fails, do basic normalization
    return url.toLowerCase().replace(/\/+$/, "");
  }
}

interface AggregatorOptions {
  sources?: DataSource[];
  enableX402Apis?: boolean; // Disabled by default since registry is empty
}

export class EndpointAggregator {
  private sources: DataSource[];

  constructor(options: AggregatorOptions = {}) {
    if (options.sources) {
      this.sources = options.sources;
    } else {
      // Default sources
      this.sources = [getBazaarAdapter()];

      // x402apis is optional since their registry is currently empty
      if (options.enableX402Apis) {
        this.sources.push(getX402ApisClient());
      }
    }
  }

  /**
   * Fetch endpoints from all sources and deduplicate by resource_url
   * When duplicates exist, prefer the one with more complete data
   * @param maxPages - Maximum pages to fetch per source (default 3)
   */
  async fetchAll(maxPages: number = 3): Promise<{
    endpoints: SourceEndpoint[];
    stats: SourceStats[];
  }> {
    const stats: SourceStats[] = [];
    const allEndpoints: SourceEndpoint[] = [];

    // Fetch from all sources in parallel
    const results = await Promise.allSettled(
      this.sources.map(async (source) => {
        const startTime = Date.now();
        try {
          const endpoints = await source.fetchEndpoints(maxPages);
          const networks: Record<string, number> = {};

          for (const ep of endpoints) {
            const network = ep.network || "unknown";
            networks[network] = (networks[network] || 0) + 1;
          }

          stats.push({
            source: source.name,
            count: endpoints.length,
            networks,
            lastFetch: new Date(),
          });

          return { source: source.name, endpoints };
        } catch (error) {
          console.error(`[aggregator] Error fetching from ${source.name}:`, error);
          stats.push({
            source: source.name,
            count: 0,
            networks: {},
            lastFetch: new Date(),
          });
          return { source: source.name, endpoints: [] };
        }
      })
    );

    // Collect all endpoints
    for (const result of results) {
      if (result.status === "fulfilled" && result.value.endpoints) {
        allEndpoints.push(...result.value.endpoints);
      }
    }

    // Deduplicate by resource_url, preferring endpoints with more data
    const deduplicated = this.deduplicateEndpoints(allEndpoints);

    console.log(
      `[aggregator] Total: ${allEndpoints.length}, Deduplicated: ${deduplicated.length}`
    );

    return { endpoints: deduplicated, stats };
  }

  /**
   * Deduplicate endpoints by resource_url
   * When duplicates exist, prefer the one with more complete data
   */
  private deduplicateEndpoints(endpoints: SourceEndpoint[]): SourceEndpoint[] {
    const urlMap = new Map<string, SourceEndpoint>();

    for (const endpoint of endpoints) {
      const normalizedUrl = this.normalizeUrl(endpoint.resource_url);
      const existing = urlMap.get(normalizedUrl);

      if (!existing) {
        urlMap.set(normalizedUrl, endpoint);
      } else {
        // Prefer the endpoint with more complete data
        const existingScore = this.scoreCompleteness(existing);
        const newScore = this.scoreCompleteness(endpoint);

        if (newScore > existingScore) {
          urlMap.set(normalizedUrl, endpoint);
        }
      }
    }

    return Array.from(urlMap.values());
  }

  /**
   * Normalize URL for deduplication (remove trailing slashes, lowercase)
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Normalize: lowercase host, remove trailing slash from path
      return `${parsed.protocol}//${parsed.host.toLowerCase()}${parsed.pathname.replace(
        /\/$/,
        ""
      )}${parsed.search}`;
    } catch {
      return url.toLowerCase().replace(/\/$/, "");
    }
  }

  /**
   * Score how complete an endpoint's data is (higher = more complete)
   */
  private scoreCompleteness(endpoint: SourceEndpoint): number {
    let score = 0;
    if (endpoint.description) score += 2;
    if (endpoint.price_micro_usdc !== null) score += 2;
    if (endpoint.network) score += 1;
    if (endpoint.pay_to_address) score += 1;
    return score;
  }

  /**
   * Get list of configured sources
   */
  getSources(): string[] {
    return this.sources.map((s) => s.name);
  }
}

// Factory function with default configuration
export function createAggregator(
  enableX402Apis: boolean = false
): EndpointAggregator {
  return new EndpointAggregator({ enableX402Apis });
}

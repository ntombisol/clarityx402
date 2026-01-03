// Adapter to make BazaarClient conform to the DataSource interface

import { getBazaarClient, BazaarClient } from "../bazaar/client";
import type { DataSource, SourceEndpoint } from "./types";

export class BazaarAdapter implements DataSource {
  name = "bazaar";
  private client: BazaarClient;

  constructor(client?: BazaarClient) {
    this.client = client || getBazaarClient();
  }

  async fetchEndpoints(maxPages: number = 3): Promise<SourceEndpoint[]> {
    const resources = await this.client.fetchAllResources(maxPages);
    const transformed = resources.map((r) => BazaarClient.transformResource(r));

    const endpoints = transformed.map((endpoint) => ({
      resource_url: endpoint.resource_url,
      description: endpoint.description,
      price_micro_usdc: endpoint.price_micro_usdc,
      network: endpoint.network,
      pay_to_address: endpoint.pay_to_address,
      source: "bazaar" as const,
      raw_data: endpoint.bazaar_data,
    }));

    console.log(`[bazaar] Fetched ${endpoints.length} endpoints`);
    return endpoints;
  }
}

// Singleton instance
let bazaarAdapter: BazaarAdapter | null = null;

export function getBazaarAdapter(): BazaarAdapter {
  if (!bazaarAdapter) {
    bazaarAdapter = new BazaarAdapter();
  }
  return bazaarAdapter;
}

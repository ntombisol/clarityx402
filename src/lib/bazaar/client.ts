import type { BazaarResource, BazaarResponse, TransformedEndpoint } from "./types";

const BAZAAR_API_URL =
  process.env.BAZAAR_API_URL ||
  "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources";

export class BazaarClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || BAZAAR_API_URL;
  }

  /**
   * Fetch all resources from the Bazaar API
   * Handles pagination if needed
   */
  async fetchAllResources(): Promise<BazaarResource[]> {
    const allResources: BazaarResource[] = [];
    let nextPageToken: string | undefined;

    do {
      const response = await this.fetchPage(nextPageToken);
      allResources.push(...response.resources);
      nextPageToken = response.nextPageToken;
    } while (nextPageToken);

    return allResources;
  }

  /**
   * Fetch a single page of resources
   */
  private async fetchPage(pageToken?: string): Promise<BazaarResponse> {
    const url = new URL(this.baseUrl);
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      // Cache for 5 minutes
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(
        `Bazaar API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Handle different response formats
    // The API might return { resources: [...] } or just an array
    if (Array.isArray(data)) {
      return { resources: data };
    }

    return data as BazaarResponse;
  }

  /**
   * Transform a Bazaar resource into our database format
   */
  static transformResource(resource: BazaarResource): TransformedEndpoint {
    const paymentDetails = resource.paymentDetails;

    // Parse price - maxAmountRequired is typically in micro units
    let priceMicroUsdc: number | null = null;
    if (paymentDetails?.maxAmountRequired) {
      const parsed = parseInt(paymentDetails.maxAmountRequired, 10);
      if (!isNaN(parsed)) {
        priceMicroUsdc = parsed;
      }
    }

    return {
      resource_url: resource.url,
      bazaar_data: resource,
      description: resource.description || null,
      price_micro_usdc: priceMicroUsdc,
      network: paymentDetails?.network || null,
      pay_to_address: paymentDetails?.payTo || null,
    };
  }

  /**
   * Fetch and transform all resources
   */
  async fetchAndTransform(): Promise<TransformedEndpoint[]> {
    const resources = await this.fetchAllResources();
    return resources.map(BazaarClient.transformResource);
  }
}

// Singleton instance
let bazaarClient: BazaarClient | null = null;

export function getBazaarClient(): BazaarClient {
  if (!bazaarClient) {
    bazaarClient = new BazaarClient();
  }
  return bazaarClient;
}

// Common types for all x402 endpoint data sources

export interface SourceEndpoint {
  resource_url: string;
  description: string | null;
  price_micro_usdc: number | null;
  network: string | null;
  pay_to_address: string | null;
  source: string; // "bazaar" | "x402apis" | etc.
  raw_data: unknown; // Original response for debugging
}

export interface DataSource {
  name: string;
  fetchEndpoints(maxPages?: number): Promise<SourceEndpoint[]>;
}

export interface SourceStats {
  source: string;
  count: number;
  networks: Record<string, number>;
  lastFetch: Date;
}

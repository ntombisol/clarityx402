// Types for Coinbase Bazaar API responses
// Based on https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources

export interface BazaarResource {
  // The URL of the x402 endpoint
  url: string;

  // HTTP method (typically GET or POST)
  method?: string;

  // Human-readable description
  description?: string;

  // x402 payment details
  paymentDetails?: {
    // Maximum amount required in the smallest unit (micro USDC)
    maxAmountRequired?: string;

    // The network for payment (e.g., "base", "base-sepolia", "solana")
    network?: string;

    // Address to pay to
    payTo?: string;

    // Asset for payment (e.g., "USDC")
    asset?: string;
  };

  // Schema information for the endpoint
  schema?: {
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
  };

  // Additional metadata
  metadata?: Record<string, unknown>;

  // Provider information
  provider?: {
    name?: string;
    url?: string;
  };
}

export interface BazaarResponse {
  resources: BazaarResource[];
  nextOffset?: number;
}

// Transformed endpoint for our database
export interface TransformedEndpoint {
  resource_url: string;
  bazaar_data: BazaarResource;
  description: string | null;
  price_micro_usdc: number | null;
  network: string | null;
  pay_to_address: string | null;
}

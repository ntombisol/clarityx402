import { SignJWT } from "jose";
import { createPrivateKey } from "crypto";
import { p256 } from "@noble/curves/nist.js";
import type { BazaarResource, BazaarResponse, TransformedEndpoint } from "./types";

const BAZAAR_API_URL =
  process.env.BAZAAR_API_URL ||
  "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources";

/**
 * Convert bytes to base64url
 */
function toBase64url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Generate a JWT for CDP API authentication
 */
async function generateCDPToken(
  keyName: string,
  keySecret: string,
  requestMethod: string,
  requestPath: string
): Promise<string> {
  const uri = `${requestMethod} api.cdp.coinbase.com${requestPath}`;

  // The CDP API key secret is base64 encoded - decode it
  const keyBytes = Buffer.from(keySecret, "base64");

  // For ES256 (P-256), the private key d value is 32 bytes
  // CDP keys may include extra data, so extract first 32 bytes
  const dBytes = keyBytes.subarray(0, 32);

  // Use noble/curves to derive the public key from private key
  const publicKey = p256.getPublicKey(dBytes, false); // false = uncompressed
  // Uncompressed public key is 65 bytes: 0x04 || x (32 bytes) || y (32 bytes)
  const xBytes = publicKey.subarray(1, 33);
  const yBytes = publicKey.subarray(33, 65);

  // Convert all to base64url for JWK
  const dBase64url = toBase64url(dBytes);
  const xBase64url = toBase64url(xBytes);
  const yBase64url = toBase64url(yBytes);

  // Create private key from complete JWK
  const privateKey = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      d: dBase64url,
      x: xBase64url,
      y: yBase64url,
    },
    format: "jwk",
  });

  const now = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID();

  const jwt = await new SignJWT({
    sub: keyName,
    iss: "cdp",
    aud: ["cdp_service"],
    uri,
  })
    .setProtectedHeader({ alg: "ES256", kid: keyName, typ: "JWT", nonce })
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(now + 120) // 2 minutes
    .sign(privateKey);

  return jwt;
}

export class BazaarClient {
  private baseUrl: string;
  private keyName: string | undefined;
  private keySecret: string | undefined;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || BAZAAR_API_URL;
    this.keyName = process.env.CDP_API_KEY_NAME;
    this.keySecret = process.env.CDP_API_KEY_SECRET;
  }

  /**
   * Fetch all resources from the Bazaar API
   * Handles pagination if needed
   */
  async fetchAllResources(maxPages: number = 20): Promise<BazaarResource[]> {
    const allResources: BazaarResource[] = [];
    let offset: number | undefined;
    let pagesLoaded = 0;
    let retryCount = 0;
    const maxRetries = 3;

    do {
      try {
        const response = await this.fetchPage(offset);
        allResources.push(...response.resources);
        offset = response.nextOffset;
        pagesLoaded++;
        retryCount = 0; // Reset on success

        // Limit pages to avoid rate limiting; cron will eventually sync all
        if (pagesLoaded >= maxPages) {
          console.log(`[Bazaar] Reached max pages limit (${maxPages}), stopping pagination`);
          break;
        }

        // Delay between requests to avoid rate limiting
        if (offset !== undefined) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        // Check if rate limited
        if (error instanceof Error && error.message.includes("429")) {
          retryCount++;
          if (retryCount > maxRetries) {
            console.log(`[Bazaar] Rate limited after ${maxRetries} retries, returning ${allResources.length} resources`);
            break;
          }
          // Exponential backoff: 10s, 30s, 60s
          const delay = Math.min(10000 * Math.pow(2, retryCount), 60000);
          console.log(`[Bazaar] Rate limited, waiting ${delay/1000}s before retry ${retryCount}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    } while (offset !== undefined);

    return allResources;
  }

  /**
   * Fetch a single page of resources
   */
  private async fetchPage(offset?: number): Promise<BazaarResponse> {
    const url = new URL(this.baseUrl);
    if (offset) {
      url.searchParams.set("offset", offset.toString());
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    // Add CDP authentication if credentials are available
    if (this.keyName && this.keySecret) {
      try {
        const path = url.pathname + url.search;
        const token = await generateCDPToken(this.keyName, this.keySecret, "GET", path);
        headers["Authorization"] = `Bearer ${token}`;
      } catch (error) {
        console.error("[Bazaar] Error generating CDP token:", error);
        throw new Error(`Failed to authenticate with CDP API: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      const headers: Record<string, string> = {};
      response.headers.forEach((v, k) => {
        if (k.toLowerCase().includes('rate') || k.toLowerCase().includes('retry') || k.toLowerCase().includes('limit')) {
          headers[k] = v;
        }
      });
      console.error("[Bazaar] API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText || "(empty)",
        rateLimitHeaders: Object.keys(headers).length > 0 ? headers : "(none)",
      });
      throw new Error(
        `Bazaar API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Handle { items: [...] } format (actual Bazaar API format)
    if (data.items && Array.isArray(data.items)) {
      // Transform from Bazaar format to our format
      const resources: BazaarResource[] = data.items.map((item: {
        resource?: string;
        url?: string;
        description?: string;
        accepts?: Array<{ maxAmountRequired?: string; network?: string; payTo?: string; asset?: string }>;
        metadata?: Record<string, unknown>;
        provider?: { name?: string; url?: string };
      }) => ({
        url: item.resource || item.url || "",
        description: item.description,
        paymentDetails: item.accepts?.[0] ? {
          maxAmountRequired: item.accepts[0].maxAmountRequired,
          network: item.accepts[0].network,
          payTo: item.accepts[0].payTo,
          asset: item.accepts[0].asset,
        } : undefined,
        metadata: item.metadata,
        provider: item.provider,
      }));
      // Calculate next offset based on current position and total
      const pagination = data.pagination;
      let nextOffset: number | undefined;
      if (pagination && pagination.offset + pagination.limit < pagination.total) {
        nextOffset = pagination.offset + pagination.limit;
      }

      return {
        resources,
        nextOffset
      };
    }

    // Handle different response formats
    // The API might return { resources: [...] } or just an array
    if (Array.isArray(data)) {
      return { resources: data };
    }

    // Handle { data: [...] } format (legacy)
    if (data.data && Array.isArray(data.data)) {
      return { resources: data.data };
    }

    // Handle { resources: [...] } format
    if (data.resources && Array.isArray(data.resources)) {
      return data as BazaarResponse;
    }

    console.log("[Bazaar] Unexpected response format:", JSON.stringify(data).slice(0, 500));
    return { resources: [] };
  }

  /**
   * Normalize network identifiers to consistent names
   * Handles EIP-155 chain IDs and various formats
   */
  static normalizeNetwork(network: string | undefined): string | null {
    if (!network) return null;

    const normalized = network.toLowerCase();

    // Map EIP-155 chain IDs to friendly names
    const chainIdMap: Record<string, string> = {
      "eip155:1": "ethereum",
      "eip155:8453": "base",
      "eip155:84532": "base-sepolia",
      "eip155:137": "polygon",
      "eip155:80001": "polygon-mumbai",
      "eip155:42161": "arbitrum",
      "eip155:10": "optimism",
      "eip155:56": "bsc",
    };

    if (chainIdMap[normalized]) {
      return chainIdMap[normalized];
    }

    // Already friendly name
    return normalized;
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
      network: BazaarClient.normalizeNetwork(paymentDetails?.network),
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

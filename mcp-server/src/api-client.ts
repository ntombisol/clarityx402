// API client for calling the Clarityx402 REST API

const DEFAULT_API_URL = process.env.CLARITYX402_API_URL || "https://clarityx402.vercel.app";

export interface Endpoint {
  id: string;
  resource_url: string;
  description: string | null;
  price_micro_usdc: number | null;
  network: string | null;
  category: string | null;
  uptime_24h: number | null;
  uptime_7d: number | null;
  avg_latency_ms: number | null;
  p95_latency_ms: number | null;
  tags: string[] | null;
  is_active: boolean;
}

export interface Category {
  slug: string;
  name: string;
  description: string | null;
  endpoint_count: number;
}

export interface HealthStatus {
  url: string;
  status: "operational" | "degraded" | "down" | "unknown";
  isActive: boolean;
  metrics: {
    uptime_24h: number | null;
    uptime_7d: number | null;
    uptime_30d: number | null;
    avg_latency_ms: number | null;
    p95_latency_ms: number | null;
    error_rate: number | null;
  };
  lastSeen: string | null;
  consecutiveFailures: number;
}

export interface PriceHistoryRecord {
  recorded_at: string;
  price_micro_usdc: number;
}

export class ClarityApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || DEFAULT_API_URL;
  }

  async listEndpoints(options?: {
    category?: string;
    min_uptime?: number;
    max_price?: number;
    sort?: "uptime" | "price" | "latency";
    limit?: number;
  }): Promise<{ data: Endpoint[]; pagination: { total: number } }> {
    const params = new URLSearchParams();
    if (options?.category) params.set("category", options.category);
    if (options?.min_uptime) params.set("min_uptime", options.min_uptime.toString());
    if (options?.max_price) params.set("max_price", options.max_price.toString());
    if (options?.sort) params.set("sort", options.sort);
    if (options?.limit) params.set("limit", options.limit.toString());

    const response = await fetch(`${this.baseUrl}/api/endpoints?${params}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json() as Promise<{ data: Endpoint[]; pagination: { total: number } }>;
  }

  async getEndpoint(id: string): Promise<{ endpoint: Endpoint }> {
    const response = await fetch(`${this.baseUrl}/api/endpoints/${id}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json() as Promise<{ endpoint: Endpoint }>;
  }

  async compareEndpoints(
    category: string,
    sort?: "score" | "price" | "uptime" | "latency"
  ): Promise<{ category: string; endpoints: (Endpoint & { rank: number; score: number })[] }> {
    const params = new URLSearchParams({ category });
    if (sort) params.set("sort", sort);

    const response = await fetch(`${this.baseUrl}/api/compare?${params}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json() as Promise<{ category: string; endpoints: (Endpoint & { rank: number; score: number })[] }>;
  }

  async getRecommendation(options: {
    task: string;
    budget?: number;
    min_uptime?: number;
  }): Promise<{
    recommendation: { endpoint: Endpoint; reasoning: string[] } | null;
    alternatives: { rank: number; endpoint: Endpoint }[];
  }> {
    const params = new URLSearchParams({ task: options.task });
    if (options.budget) params.set("budget", options.budget.toString());
    if (options.min_uptime) params.set("min_uptime", options.min_uptime.toString());

    const response = await fetch(`${this.baseUrl}/api/recommend?${params}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json() as Promise<{
      recommendation: { endpoint: Endpoint; reasoning: string[] } | null;
      alternatives: { rank: number; endpoint: Endpoint }[];
    }>;
  }

  async checkHealth(url: string): Promise<HealthStatus> {
    const response = await fetch(
      `${this.baseUrl}/api/health/${encodeURIComponent(url)}`
    );
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json() as Promise<HealthStatus>;
  }

  async listCategories(): Promise<{
    categories: Category[];
    summary: { totalCategories: number; totalEndpoints: number };
  }> {
    const response = await fetch(`${this.baseUrl}/api/categories`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json() as Promise<{
      categories: Category[];
      summary: { totalCategories: number; totalEndpoints: number };
    }>;
  }

  async getPriceHistory(
    endpointId: string,
    days?: number
  ): Promise<{
    endpoint: { id: string; url: string };
    history: PriceHistoryRecord[];
    stats: { min: number; max: number; avg: number; trend: string };
  }> {
    const params = new URLSearchParams();
    if (days) params.set("days", days.toString());

    const response = await fetch(
      `${this.baseUrl}/api/price-history/${endpointId}?${params}`
    );
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json() as Promise<{
      endpoint: { id: string; url: string };
      history: PriceHistoryRecord[];
      stats: { min: number; max: number; avg: number; trend: string };
    }>;
  }
}

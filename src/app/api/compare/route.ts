import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface EndpointRow {
  id: string;
  resource_url: string;
  description: string | null;
  price_micro_usdc: number | null;
  network: string | null;
  uptime_24h: number | null;
  uptime_7d: number | null;
  avg_latency_ms: number | null;
  p95_latency_ms: number | null;
  tags: string[] | null;
  last_seen_at: string | null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const category = searchParams.get("category");
  const sort = searchParams.get("sort") || "score"; // score, price, uptime, latency
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

  if (!category) {
    return NextResponse.json(
      { error: "Category parameter is required" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    // Fetch endpoints in the category
    const { data, error } = await supabase
      .from("endpoints")
      .select(
        `
        id,
        resource_url,
        description,
        price_micro_usdc,
        network,
        uptime_24h,
        uptime_7d,
        avg_latency_ms,
        p95_latency_ms,
        tags,
        last_seen_at
      `
      )
      .eq("category", category)
      .eq("is_active", true)
      .not("uptime_24h", "is", null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const endpoints = data as EndpointRow[] | null;

    if (!endpoints || endpoints.length === 0) {
      return NextResponse.json({
        category,
        endpoints: [],
        message: "No endpoints found in this category",
      });
    }

    // Calculate a quality score for each endpoint
    const scoredEndpoints = endpoints.map((endpoint) => {
      const score = calculateQualityScore(endpoint);
      return { ...endpoint, score };
    });

    // Sort based on preference
    scoredEndpoints.sort((a, b) => {
      switch (sort) {
        case "price":
          return (a.price_micro_usdc || Infinity) - (b.price_micro_usdc || Infinity);
        case "uptime":
          return (b.uptime_24h || 0) - (a.uptime_24h || 0);
        case "latency":
          return (a.avg_latency_ms || Infinity) - (b.avg_latency_ms || Infinity);
        case "score":
        default:
          return b.score - a.score;
      }
    });

    // Limit results
    const limitedEndpoints = scoredEndpoints.slice(0, limit);

    // Add rankings
    const rankedEndpoints = limitedEndpoints.map((endpoint, index) => ({
      rank: index + 1,
      ...endpoint,
    }));

    return NextResponse.json({
      category,
      sortedBy: sort,
      endpoints: rankedEndpoints,
      totalInCategory: endpoints.length,
    });
  } catch (error) {
    console.error("[API/compare] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

interface ScoredEndpoint {
  uptime_24h: number | null;
  avg_latency_ms: number | null;
  price_micro_usdc: number | null;
}

function calculateQualityScore(endpoint: ScoredEndpoint): number {
  // Weighted scoring:
  // - Uptime (40%): Higher is better
  // - Latency (30%): Lower is better
  // - Price (30%): Lower is better

  let score = 0;

  // Uptime score (0-40 points)
  if (endpoint.uptime_24h !== null) {
    score += (endpoint.uptime_24h / 100) * 40;
  }

  // Latency score (0-30 points) - inverse, lower is better
  // Assume 0-2000ms range, with <200ms being excellent
  if (endpoint.avg_latency_ms !== null) {
    const latencyScore = Math.max(0, 1 - endpoint.avg_latency_ms / 2000);
    score += latencyScore * 30;
  }

  // Price score (0-30 points) - inverse, lower is better
  // This is tricky without knowing the range, so we'll normalize later
  // For now, give points if price exists (it's comparable)
  if (endpoint.price_micro_usdc !== null) {
    // Assume 0-1000000 micro USDC range ($0-$1)
    const priceScore = Math.max(
      0,
      1 - endpoint.price_micro_usdc / 1000000
    );
    score += priceScore * 30;
  }

  return Math.round(score * 100) / 100;
}

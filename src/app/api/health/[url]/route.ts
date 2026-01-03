import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ url: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { url: encodedUrl } = await params;
  const url = decodeURIComponent(encodedUrl);

  try {
    const supabase = await createClient();

    // Find endpoint by URL
    const { data: endpoint, error } = await supabase
      .from("endpoints")
      .select(
        `
        id,
        resource_url,
        description,
        category,
        is_active,
        uptime_24h,
        uptime_7d,
        uptime_30d,
        avg_latency_ms,
        p95_latency_ms,
        error_rate,
        last_seen_at,
        last_error_at,
        consecutive_failures
      `
      )
      .eq("resource_url", url)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Endpoint not found", url },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch last 10 pings
    const { data: recentPings } = await supabase
      .from("pings")
      .select("pinged_at, success, status_code, latency_ms, error_message")
      .eq("endpoint_id", endpoint.id)
      .order("pinged_at", { ascending: false })
      .limit(10);

    // Determine current status
    const status = determineStatus(endpoint, recentPings || []);

    return NextResponse.json({
      url: endpoint.resource_url,
      status,
      isActive: endpoint.is_active,
      metrics: {
        uptime_24h: endpoint.uptime_24h,
        uptime_7d: endpoint.uptime_7d,
        uptime_30d: endpoint.uptime_30d,
        avg_latency_ms: endpoint.avg_latency_ms,
        p95_latency_ms: endpoint.p95_latency_ms,
        error_rate: endpoint.error_rate,
      },
      lastSeen: endpoint.last_seen_at,
      lastError: endpoint.last_error_at,
      consecutiveFailures: endpoint.consecutive_failures,
      recentPings: recentPings || [],
    });
  } catch (error) {
    console.error("[API/health] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

interface EndpointStatus {
  is_active: boolean;
  uptime_24h: number | null;
  consecutive_failures: number;
}

interface PingRecord {
  success: boolean;
}

function determineStatus(
  endpoint: EndpointStatus,
  recentPings: PingRecord[]
): "operational" | "degraded" | "down" | "unknown" {
  if (!endpoint.is_active) {
    return "down";
  }

  if (recentPings.length === 0) {
    return "unknown";
  }

  // Check recent ping success rate
  const recentSuccesses = recentPings.filter((p) => p.success).length;
  const recentRate = recentSuccesses / recentPings.length;

  if (recentRate >= 0.9 && endpoint.consecutive_failures === 0) {
    return "operational";
  }

  if (recentRate >= 0.5 || endpoint.uptime_24h !== null && endpoint.uptime_24h >= 90) {
    return "degraded";
  }

  return "down";
}

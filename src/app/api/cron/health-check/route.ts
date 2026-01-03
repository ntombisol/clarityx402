import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateMetrics, shouldMarkInactive } from "@/lib/metrics/calculator";
import type { Ping } from "@/types/database";

interface EndpointRow {
  id: string;
  resource_url: string;
  consecutive_failures: number;
}

// Timeout for each endpoint ping (5 seconds)
const PING_TIMEOUT = 5000;

// Maximum endpoints to check per invocation (to stay within Vercel limits)
const BATCH_SIZE = 50;

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const stats = {
    checked: 0,
    successful: 0,
    failed: 0,
    errors: 0,
  };

  try {
    const supabase = createAdminClient();

    // Get active endpoints, prioritizing those not recently checked
    const { data, error: fetchError } = await supabase
      .from("endpoints")
      .select("id, resource_url, consecutive_failures")
      .eq("is_active", true)
      .order("last_seen_at", { ascending: true, nullsFirst: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      throw new Error(`Error fetching endpoints: ${fetchError.message}`);
    }

    const endpoints = data as EndpointRow[] | null;

    if (!endpoints || endpoints.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No endpoints to check",
        stats,
        duration: Date.now() - startTime,
      });
    }

    console.log(`[HealthCheck] Checking ${endpoints.length} endpoints...`);

    // Ping endpoints in parallel (with concurrency limit)
    const results = await Promise.allSettled(
      endpoints.map((endpoint) => pingEndpoint(endpoint))
    );

    // Process results
    const pingRecords: PingRecord[] = [];
    const endpointUpdates: Array<{
      id: string;
      last_seen_at?: string;
      last_error_at?: string;
      consecutive_failures: number;
    }> = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const endpoint = endpoints[i];
      stats.checked++;

      if (result.status === "fulfilled") {
        const pingResult = result.value;
        pingRecords.push(pingResult.ping);

        if (pingResult.ping.success) {
          stats.successful++;
          endpointUpdates.push({
            id: endpoint.id,
            last_seen_at: new Date().toISOString(),
            consecutive_failures: 0,
          });
        } else {
          stats.failed++;
          const newFailures = (endpoint.consecutive_failures || 0) + 1;
          endpointUpdates.push({
            id: endpoint.id,
            last_error_at: new Date().toISOString(),
            consecutive_failures: newFailures,
          });
        }
      } else {
        stats.errors++;
        console.error(
          `[HealthCheck] Error pinging ${endpoint.resource_url}:`,
          result.reason
        );
      }
    }

    // Insert ping records
    if (pingRecords.length > 0) {
      const { error: insertError } = await supabase
        .from("pings")
        .insert(pingRecords);

      if (insertError) {
        console.error("[HealthCheck] Error inserting pings:", insertError);
      }
    }

    // Update endpoint statuses
    for (const update of endpointUpdates) {
      const { id, ...data } = update;

      // Check if endpoint should be marked inactive
      const isActive = !shouldMarkInactive(data.consecutive_failures);

      const { error: updateError } = await supabase
        .from("endpoints")
        .update({
          ...data,
          is_active: isActive,
        })
        .eq("id", id);

      if (updateError) {
        console.error(`[HealthCheck] Error updating endpoint ${id}:`, updateError);
      }
    }

    // Update metrics for checked endpoints
    await updateEndpointMetrics(supabase, endpoints.map((e) => e.id));

    const duration = Date.now() - startTime;
    console.log(`[HealthCheck] Completed in ${duration}ms:`, JSON.stringify(stats));

    return NextResponse.json({
      success: true,
      stats,
      duration,
    });
  } catch (error) {
    console.error("[HealthCheck] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

interface PingRecord {
  endpoint_id: string;
  success: boolean;
  status_code: number | null;
  latency_ms: number;
  error_message: string | null;
}

interface PingResult {
  ping: PingRecord;
}

async function pingEndpoint(endpoint: { id: string; resource_url: string }): Promise<PingResult> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);

    const response = await fetch(endpoint.resource_url, {
      method: "HEAD", // Use HEAD to minimize data transfer
      signal: controller.signal,
      headers: {
        "User-Agent": "Clarityx402-HealthCheck/1.0",
      },
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    // For x402 endpoints, a 402 response is actually expected/success
    // We consider 2xx, 3xx, and 402 as "reachable"
    const isSuccess =
      response.ok || response.status === 402 || (response.status >= 300 && response.status < 400);

    return {
      ping: {
        endpoint_id: endpoint.id,
        success: isSuccess,
        status_code: response.status,
        latency_ms: latency,
        error_message: isSuccess ? null : `HTTP ${response.status}`,
      },
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Timeout"
          : error.message
        : "Unknown error";

    return {
      ping: {
        endpoint_id: endpoint.id,
        success: false,
        status_code: null,
        latency_ms: latency,
        error_message: errorMessage,
      },
    };
  }
}

async function updateEndpointMetrics(
  supabase: ReturnType<typeof createAdminClient>,
  endpointIds: string[]
) {
  // For each endpoint, fetch recent pings and calculate metrics
  for (const endpointId of endpointIds) {
    try {
      // Get pings from last 30 days
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: pingsData, error } = await supabase
        .from("pings")
        .select("*")
        .eq("endpoint_id", endpointId)
        .gte("pinged_at", thirtyDaysAgo)
        .order("pinged_at", { ascending: false });

      if (error) {
        console.error(`[HealthCheck] Error fetching pings for ${endpointId}:`, error);
        continue;
      }

      const pings = pingsData as Ping[] | null;

      if (!pings || pings.length === 0) {
        continue;
      }

      // Calculate metrics
      const metrics = calculateMetrics(pings);

      // Update endpoint with new metrics
      const { error: updateError } = await supabase
        .from("endpoints")
        .update({
          uptime_24h: metrics.uptime_24h,
          uptime_7d: metrics.uptime_7d,
          uptime_30d: metrics.uptime_30d,
          avg_latency_ms: metrics.avg_latency_ms,
          p95_latency_ms: metrics.p95_latency_ms,
          error_rate: metrics.error_rate,
        })
        .eq("id", endpointId);

      if (updateError) {
        console.error(`[HealthCheck] Error updating metrics for ${endpointId}:`, updateError);
      }
    } catch (err) {
      console.error(`[HealthCheck] Error calculating metrics for ${endpointId}:`, err);
    }
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

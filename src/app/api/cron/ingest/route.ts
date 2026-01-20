import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAggregator, normalizeResourceUrl, type SourceEndpoint, type SourceStats } from "@/lib/sources";
import { classifyEndpoint, generateDescriptionFromUrl } from "@/lib/classifier";

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If no secret is configured, allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const stats = {
    fetched: 0,
    inserted: 0,
    updated: 0,
    errors: 0,
  };
  const errorDetails: string[] = [];
  let sourceStats: SourceStats[] = [];

  try {
    const supabase = createAdminClient();

    // Allow controlling max pages via query param (default 20, max 30)
    // With ~100 endpoints per page, 20 pages = ~2000 endpoints
    const url = new URL(request.url);
    const maxPagesParam = url.searchParams.get("maxPages");
    const maxPages = Math.min(Math.max(parseInt(maxPagesParam || "20", 10) || 20, 1), 30);

    // Enable x402apis via env var (disabled by default since registry is empty)
    const enableX402Apis = process.env.ENABLE_X402APIS === "true";
    const aggregator = createAggregator(enableX402Apis);

    // Fetch all resources from all configured sources
    console.log(`[Ingest] Fetching from sources: ${aggregator.getSources().join(", ")} (maxPages: ${maxPages})`);
    const { endpoints, stats: srcStats } = await aggregator.fetchAll(maxPages);
    sourceStats = srcStats;
    stats.fetched = endpoints.length;
    console.log(`[Ingest] Fetched ${endpoints.length} endpoints from ${srcStats.length} source(s)`);

    // Process each endpoint
    for (const endpoint of endpoints) {
      try {
        // Normalize URL for consistent storage and deduplication
        const normalizedUrl = normalizeResourceUrl(endpoint.resource_url);

        // Generate description from URL if none provided
        const description = endpoint.description || generateDescriptionFromUrl(normalizedUrl);

        // Classify the endpoint using description and raw data
        const classification = classifyEndpoint({
          url: normalizedUrl,
          description: description || undefined,
          metadata: endpoint.raw_data as Record<string, unknown> | undefined,
        });

        // Prepare the endpoint data
        // Re-activate endpoints and reset failures when they appear in source data
        const endpointData = {
          resource_url: normalizedUrl,
          bazaar_data: endpoint.raw_data,
          description: description,
          price_micro_usdc: endpoint.price_micro_usdc,
          network: endpoint.network,
          pay_to_address: endpoint.pay_to_address,
          category: classification.category,
          tags: classification.tags,
          source: endpoint.source,
          updated_at: new Date().toISOString(),
          is_active: true,
          consecutive_failures: 0,
        };

        // Upsert the endpoint
        const { error } = await supabase
          .from("endpoints")
          .upsert(endpointData, {
            onConflict: "resource_url",
            ignoreDuplicates: false,
          });

        if (error) {
          console.error(`[Ingest] Error upserting ${normalizedUrl}:`, error);
          if (errorDetails.length < 5) {
            errorDetails.push(`${normalizedUrl}: ${error.message}`);
          }
          stats.errors++;
        } else {
          stats.updated++;
        }
      } catch (err) {
        console.error(`[Ingest] Error processing ${endpoint.resource_url}:`, err);
        if (errorDetails.length < 5) {
          errorDetails.push(`${endpoint.resource_url}: ${err instanceof Error ? err.message : String(err)}`);
        }
        stats.errors++;
      }
    }

    // Record today's prices for price history
    await recordPriceSnapshots(supabase);

    const duration = Date.now() - startTime;
    console.log(
      `[Ingest] Completed in ${duration}ms:`,
      JSON.stringify(stats)
    );

    return NextResponse.json({
      success: true,
      stats,
      sources: sourceStats,
      duration,
      ...(errorDetails.length > 0 ? { sampleErrors: errorDetails } : {}),
    });
  } catch (error) {
    console.error("[Ingest] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function recordPriceSnapshots(supabase: ReturnType<typeof createAdminClient>) {
  const today = new Date().toISOString().split("T")[0];

  // Get all active endpoints with prices
  const { data: endpoints, error: fetchError } = await supabase
    .from("endpoints")
    .select("id, price_micro_usdc")
    .eq("is_active", true)
    .not("price_micro_usdc", "is", null);

  if (fetchError) {
    console.error("[Ingest] Error fetching endpoints for price snapshot:", fetchError);
    return;
  }

  if (!endpoints || endpoints.length === 0) {
    return;
  }

  // Insert price history records (ignore conflicts for today)
  const priceRecords = endpoints.map((endpoint) => ({
    endpoint_id: endpoint.id,
    recorded_at: today,
    price_micro_usdc: endpoint.price_micro_usdc!,
  }));

  const { error: insertError } = await supabase
    .from("price_history")
    .upsert(priceRecords, {
      onConflict: "endpoint_id,recorded_at",
      ignoreDuplicates: true,
    });

  if (insertError) {
    console.error("[Ingest] Error recording price snapshots:", insertError);
  } else {
    console.log(`[Ingest] Recorded ${priceRecords.length} price snapshots for ${today}`);
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

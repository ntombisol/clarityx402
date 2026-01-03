import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBazaarClient, BazaarClient } from "@/lib/bazaar/client";
import { classifyEndpoint } from "@/lib/classifier";

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

  try {
    const supabase = createAdminClient();
    const bazaarClient = getBazaarClient();

    // Fetch all resources from Bazaar
    console.log("[Ingest] Fetching resources from Bazaar...");
    const resources = await bazaarClient.fetchAllResources();
    stats.fetched = resources.length;
    console.log(`[Ingest] Fetched ${resources.length} resources`);

    // Process each resource
    for (const resource of resources) {
      try {
        // Transform the resource
        const transformed = BazaarClient.transformResource(resource);

        // Classify the endpoint
        const classification = classifyEndpoint(resource);

        // Prepare the endpoint data
        const endpointData = {
          resource_url: transformed.resource_url,
          bazaar_data: transformed.bazaar_data,
          description: transformed.description,
          price_micro_usdc: transformed.price_micro_usdc,
          network: transformed.network,
          pay_to_address: transformed.pay_to_address,
          category: classification.category,
          tags: classification.tags,
          updated_at: new Date().toISOString(),
        };

        // Upsert the endpoint
        const { error } = await supabase
          .from("endpoints")
          .upsert(endpointData, {
            onConflict: "resource_url",
            ignoreDuplicates: false,
          });

        if (error) {
          console.error(`[Ingest] Error upserting ${resource.url}:`, error);
          stats.errors++;
        } else {
          // We can't easily distinguish insert vs update with upsert
          // Count as updated for simplicity
          stats.updated++;
        }
      } catch (err) {
        console.error(`[Ingest] Error processing ${resource.url}:`, err);
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
      duration,
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

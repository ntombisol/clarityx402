import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const days = Math.min(parseInt(searchParams.get("days") || "30"), 365);

  try {
    const supabase = await createClient();

    // Verify endpoint exists
    const { data: endpoint, error: endpointError } = await supabase
      .from("endpoints")
      .select("id, resource_url, description, price_micro_usdc")
      .eq("id", id)
      .single();

    if (endpointError) {
      if (endpointError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Endpoint not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: endpointError.message }, { status: 500 });
    }

    // Calculate date range
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Fetch price history
    const { data: history, error: historyError } = await supabase
      .from("price_history")
      .select("recorded_at, price_micro_usdc")
      .eq("endpoint_id", id)
      .gte("recorded_at", startDate)
      .order("recorded_at", { ascending: true });

    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 500 });
    }

    // Calculate price statistics
    const stats = calculatePriceStats(
      history || [],
      endpoint.price_micro_usdc
    );

    return NextResponse.json({
      endpoint: {
        id: endpoint.id,
        url: endpoint.resource_url,
        description: endpoint.description,
        currentPrice: endpoint.price_micro_usdc,
      },
      history: history || [],
      stats,
      periodDays: days,
    });
  } catch (error) {
    console.error("[API/price-history] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

interface PriceRecord {
  price_micro_usdc: number;
}

interface PriceStats {
  min: number | null;
  max: number | null;
  avg: number | null;
  change: number | null;
  changePercent: number | null;
  trend: "up" | "down" | "stable" | "unknown";
}

function calculatePriceStats(
  history: PriceRecord[],
  currentPrice: number | null
): PriceStats {
  if (history.length === 0) {
    return {
      min: currentPrice,
      max: currentPrice,
      avg: currentPrice,
      change: null,
      changePercent: null,
      trend: "unknown",
    };
  }

  const prices = history.map((h) => h.price_micro_usdc);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

  const firstPrice = prices[0];
  const lastPrice = currentPrice || prices[prices.length - 1];
  const change = lastPrice - firstPrice;
  const changePercent = firstPrice !== 0 ? (change / firstPrice) * 100 : null;

  let trend: PriceStats["trend"] = "stable";
  if (changePercent !== null) {
    if (changePercent > 5) trend = "up";
    else if (changePercent < -5) trend = "down";
  }

  return {
    min,
    max,
    avg: Math.round(avg),
    change,
    changePercent: changePercent !== null ? Math.round(changePercent * 100) / 100 : null,
    trend,
  };
}

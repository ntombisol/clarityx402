import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const supabase = await createClient();

    // Fetch endpoint details
    const { data: endpoint, error } = await supabase
      .from("endpoints")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Endpoint not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch recent pings (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentPings } = await supabase
      .from("pings")
      .select("pinged_at, success, status_code, latency_ms")
      .eq("endpoint_id", id)
      .gte("pinged_at", oneDayAgo)
      .order("pinged_at", { ascending: false })
      .limit(100);

    // Fetch price history (last 30 days)
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data: priceHistory } = await supabase
      .from("price_history")
      .select("recorded_at, price_micro_usdc")
      .eq("endpoint_id", id)
      .gte("recorded_at", thirtyDaysAgo.split("T")[0])
      .order("recorded_at", { ascending: true });

    return NextResponse.json({
      endpoint,
      recentPings: recentPings || [],
      priceHistory: priceHistory || [],
    });
  } catch (error) {
    console.error("[API/endpoints/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

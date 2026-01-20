import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Parse query parameters
  const category = searchParams.get("category");
  const minUptime = searchParams.get("min_uptime");
  const maxPrice = searchParams.get("max_price");
  const sort = searchParams.get("sort") || "uptime"; // uptime, price, latency
  const order = searchParams.get("order") || "desc";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  const search = searchParams.get("search");

  try {
    const supabase = await createClient();

    // Build query
    let query = supabase
      .from("endpoints")
      .select(
        `
        id,
        resource_url,
        description,
        price_micro_usdc,
        network,
        category,
        tags,
        uptime_24h,
        uptime_7d,
        avg_latency_ms,
        p95_latency_ms,
        last_seen_at,
        is_active,
        updated_at
      `,
        { count: "exact" }
      )
      .eq("is_active", true);

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }

    if (minUptime) {
      query = query.gte("uptime_24h", parseFloat(minUptime));
    }

    if (maxPrice) {
      query = query.lte("price_micro_usdc", parseInt(maxPrice));
    }

    if (search) {
      query = query.or(
        `description.ilike.%${search}%,resource_url.ilike.%${search}%`
      );
    }

    // Apply sorting
    const sortColumn = getSortColumn(sort);
    query = query.order(sortColumn, {
      ascending: order === "asc",
      nullsFirst: false,
    });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[API/endpoints] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        data,
        pagination: {
          total: count,
          limit,
          offset,
          hasMore: count ? offset + limit < count : false,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[API/endpoints] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getSortColumn(sort: string): string {
  switch (sort) {
    case "price":
      return "price_micro_usdc";
    case "latency":
      return "avg_latency_ms";
    case "uptime":
    default:
      return "uptime_24h";
  }
}

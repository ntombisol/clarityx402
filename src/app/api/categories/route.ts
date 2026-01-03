import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Fetch categories with endpoint counts
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .order("endpoint_count", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get total active endpoints
    const { count: totalEndpoints } = await supabase
      .from("endpoints")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Get uncategorized count
    const { count: uncategorizedCount } = await supabase
      .from("endpoints")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .is("category", null);

    return NextResponse.json({
      categories: categories || [],
      summary: {
        totalCategories: categories?.length || 0,
        totalEndpoints: totalEndpoints || 0,
        uncategorized: uncategorizedCount || 0,
      },
    });
  } catch (error) {
    console.error("[API/categories] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const revalidate = 60;

const categoryIcons: Record<string, string> = {
  "llm-inference": "Bot",
  "image-generation": "Image",
  "data-feeds": "Chart",
  security: "Shield",
  search: "Search",
  utilities: "Wrench",
  defi: "Coins",
  social: "Users",
};

export default async function CategoriesPage() {
  const supabase = await createClient();

  // Fetch categories with counts
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("endpoint_count", { ascending: false });

  // Fetch sample endpoints for each category
  const categoryEndpoints: Record<
    string,
    { id: string; resource_url: string; uptime_24h: number | null }[]
  > = {};

  if (categories) {
    for (const category of categories) {
      const { data: endpoints } = await supabase
        .from("endpoints")
        .select("id, resource_url, uptime_24h")
        .eq("category", category.slug)
        .eq("is_active", true)
        .order("uptime_24h", { ascending: false })
        .limit(3);

      categoryEndpoints[category.slug] = endpoints || [];
    }
  }

  // Get total stats
  const { count: totalEndpoints } = await supabase
    .from("endpoints")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: uncategorized } = await supabase
    .from("endpoints")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .is("category", null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">
          Browse x402 endpoints by service category
        </p>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm">
        <span>
          <strong>{totalEndpoints || 0}</strong> total endpoints
        </span>
        <span>
          <strong>{categories?.length || 0}</strong> categories
        </span>
        {uncategorized && uncategorized > 0 && (
          <span className="text-muted-foreground">
            {uncategorized} uncategorized
          </span>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {categories?.map((category) => (
          <Card key={category.slug} className="hover:bg-muted/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">
                    {category.icon === "bot"
                      ? "🤖"
                      : category.icon === "image"
                      ? "🎨"
                      : category.icon === "chart-line"
                      ? "📊"
                      : category.icon === "shield"
                      ? "🔒"
                      : category.icon === "search"
                      ? "🔍"
                      : category.icon === "wrench"
                      ? "🔧"
                      : category.icon === "coins"
                      ? "💰"
                      : category.icon === "users"
                      ? "👥"
                      : "📦"}
                  </span>
                  {category.name}
                </CardTitle>
                <Badge variant="secondary">{category.endpoint_count}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            </CardHeader>
            <CardContent>
              {categoryEndpoints[category.slug]?.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    Top endpoints:
                  </p>
                  {categoryEndpoints[category.slug].map((endpoint) => (
                    <Link
                      key={endpoint.id}
                      href={`/endpoints/${endpoint.id}`}
                      className="block text-sm hover:underline truncate"
                    >
                      {new URL(endpoint.resource_url).hostname}
                      {endpoint.uptime_24h !== null && (
                        <span className="text-muted-foreground ml-2">
                          {endpoint.uptime_24h}%
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No endpoints yet
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <Link href={`/endpoints?category=${category.slug}`}>
                  <Badge variant="outline" className="cursor-pointer">
                    Browse All
                  </Badge>
                </Link>
                <Link href={`/compare?category=${category.slug}`}>
                  <Badge variant="outline" className="cursor-pointer">
                    Compare
                  </Badge>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

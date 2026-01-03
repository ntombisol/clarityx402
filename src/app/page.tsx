import { createClient } from "@/lib/supabase/server";
import { StatsCard } from "@/components/endpoints/stats-card";
import { EndpointCard } from "@/components/endpoints/endpoint-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch stats
  const { count: totalEndpoints } = await supabase
    .from("endpoints")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: healthyEndpoints } = await supabase
    .from("endpoints")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .gte("uptime_24h", 95);

  const { data: categories } = await supabase
    .from("categories")
    .select("slug, name, endpoint_count")
    .order("endpoint_count", { ascending: false })
    .limit(8);

  // Fetch top endpoints by uptime
  const { data: topEndpoints } = await supabase
    .from("endpoints")
    .select(
      "id, resource_url, description, category, price_micro_usdc, uptime_24h, avg_latency_ms, is_active"
    )
    .eq("is_active", true)
    .not("uptime_24h", "is", null)
    .order("uptime_24h", { ascending: false })
    .limit(6);

  // Fetch recent activity (latest pings with failures)
  const { data: recentIssues } = await supabase
    .from("pings")
    .select(
      `
      pinged_at,
      success,
      error_message,
      endpoints (
        id,
        resource_url,
        description
      )
    `
    )
    .eq("success", false)
    .order("pinged_at", { ascending: false })
    .limit(5);

  const avgUptime =
    healthyEndpoints && totalEndpoints
      ? ((healthyEndpoints / totalEndpoints) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Quality and price intelligence for x402 endpoints
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Endpoints"
          value={totalEndpoints || 0}
          description="Active x402 endpoints indexed"
        />
        <StatsCard
          title="Healthy Endpoints"
          value={healthyEndpoints || 0}
          description="95%+ uptime in last 24h"
        />
        <StatsCard
          title="Ecosystem Health"
          value={`${avgUptime}%`}
          description="Endpoints meeting SLA"
        />
        <StatsCard
          title="Categories"
          value={categories?.length || 0}
          description="Service categories tracked"
        />
      </div>

      {/* Categories Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories?.map((category) => (
              <Link key={category.slug} href={`/endpoints?category=${category.slug}`}>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                >
                  {category.name}
                  <span className="ml-1 text-muted-foreground">
                    ({category.endpoint_count})
                  </span>
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Endpoints */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Top Endpoints</h2>
          <Link
            href="/endpoints"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topEndpoints?.map((endpoint) => (
            <EndpointCard
              key={endpoint.id}
              id={endpoint.id}
              resourceUrl={endpoint.resource_url}
              description={endpoint.description}
              category={endpoint.category}
              priceMicroUsdc={endpoint.price_micro_usdc}
              uptime24h={endpoint.uptime_24h}
              avgLatencyMs={endpoint.avg_latency_ms}
              isActive={endpoint.is_active}
            />
          ))}
        </div>
      </div>

      {/* Recent Issues */}
      {recentIssues && recentIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentIssues.map((issue, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      Failed
                    </Badge>
                    <span className="text-muted-foreground truncate max-w-[300px]">
                      {(() => {
                        const ep = issue.endpoints as unknown;
                        if (Array.isArray(ep) && ep[0]) return (ep[0] as { resource_url: string }).resource_url;
                        if (ep && typeof ep === 'object' && 'resource_url' in ep) return (ep as { resource_url: string }).resource_url;
                        return "Unknown";
                      })()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {issue.error_message || "Connection failed"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/endpoints/stats-card";

export const revalidate = 30; // Refresh more frequently for status page

export default async function StatusPage() {
  const supabase = await createClient();

  // Overall stats
  const { count: totalEndpoints } = await supabase
    .from("endpoints")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: healthyEndpoints } = await supabase
    .from("endpoints")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .gte("uptime_24h", 99);

  const { count: degradedEndpoints } = await supabase
    .from("endpoints")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .gte("uptime_24h", 90)
    .lt("uptime_24h", 99);

  const { count: downEndpoints } = await supabase
    .from("endpoints")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .lt("uptime_24h", 90);

  const { count: inactiveEndpoints } = await supabase
    .from("endpoints")
    .select("*", { count: "exact", head: true })
    .eq("is_active", false);

  // Recent pings summary
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentPings } = await supabase
    .from("pings")
    .select("*", { count: "exact", head: true })
    .gte("pinged_at", oneHourAgo);

  const { count: recentFailures } = await supabase
    .from("pings")
    .select("*", { count: "exact", head: true })
    .gte("pinged_at", oneHourAgo)
    .eq("success", false);

  const successRate =
    recentPings && recentPings > 0
      ? (((recentPings - (recentFailures || 0)) / recentPings) * 100).toFixed(1)
      : "100";

  // Endpoints with issues
  const { data: issueEndpoints } = await supabase
    .from("endpoints")
    .select("id, resource_url, description, category, uptime_24h, consecutive_failures, last_error_at")
    .eq("is_active", true)
    .or("uptime_24h.lt.90,consecutive_failures.gt.0")
    .order("consecutive_failures", { ascending: false })
    .limit(10);

  // Category health
  const { data: categories } = await supabase
    .from("categories")
    .select("slug, name, endpoint_count")
    .gt("endpoint_count", 0);

  const categoryHealth: Record<string, { healthy: number; total: number }> = {};

  if (categories) {
    for (const category of categories) {
      const { count: healthy } = await supabase
        .from("endpoints")
        .select("*", { count: "exact", head: true })
        .eq("category", category.slug)
        .eq("is_active", true)
        .gte("uptime_24h", 95);

      categoryHealth[category.slug] = {
        healthy: healthy || 0,
        total: category.endpoint_count,
      };
    }
  }

  // Overall status
  const overallStatus =
    (downEndpoints || 0) === 0 && parseFloat(successRate) >= 99
      ? "operational"
      : (downEndpoints || 0) > 5 || parseFloat(successRate) < 90
      ? "major_outage"
      : "degraded";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Status</h1>
        <p className="text-muted-foreground">
          Real-time health monitoring of the x402 ecosystem
        </p>
      </div>

      {/* Overall Status Banner */}
      <Card
        className={
          overallStatus === "operational"
            ? "bg-green-50 dark:bg-green-950 border-green-200"
            : overallStatus === "degraded"
            ? "bg-yellow-50 dark:bg-yellow-950 border-yellow-200"
            : "bg-red-50 dark:bg-red-950 border-red-200"
        }
      >
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-4 h-4 rounded-full ${
                overallStatus === "operational"
                  ? "bg-green-500"
                  : overallStatus === "degraded"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            />
            <div>
              <p className="text-lg font-semibold">
                {overallStatus === "operational"
                  ? "All Systems Operational"
                  : overallStatus === "degraded"
                  ? "Partial System Degradation"
                  : "Major Outage Detected"}
              </p>
              <p className="text-sm text-muted-foreground">
                {successRate}% success rate in the last hour
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Healthy"
          value={healthyEndpoints || 0}
          description="99%+ uptime"
        />
        <StatsCard
          title="Degraded"
          value={degradedEndpoints || 0}
          description="90-99% uptime"
        />
        <StatsCard
          title="Down"
          value={downEndpoints || 0}
          description="<90% uptime"
        />
        <StatsCard
          title="Inactive"
          value={inactiveEndpoints || 0}
          description="Not responding"
        />
        <StatsCard
          title="Pings/Hour"
          value={recentPings || 0}
          description={`${recentFailures || 0} failures`}
        />
      </div>

      {/* Category Health */}
      <Card>
        <CardHeader>
          <CardTitle>Category Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categories?.map((category) => {
              const health = categoryHealth[category.slug];
              const percentage =
                health && health.total > 0
                  ? ((health.healthy / health.total) * 100).toFixed(0)
                  : "100";

              return (
                <div
                  key={category.slug}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {health?.healthy || 0}/{health?.total || 0} healthy
                    </p>
                  </div>
                  <Badge
                    variant={
                      parseInt(percentage) >= 90
                        ? "default"
                        : parseInt(percentage) >= 70
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {percentage}%
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Issues */}
      {issueEndpoints && issueEndpoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {issueEndpoints.map((endpoint) => (
                <div
                  key={endpoint.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium truncate max-w-[400px]">
                      {new URL(endpoint.resource_url).hostname}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {endpoint.description || endpoint.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {endpoint.consecutive_failures > 0 && (
                      <Badge variant="destructive">
                        {endpoint.consecutive_failures} failures
                      </Badge>
                    )}
                    <Badge
                      variant={
                        (endpoint.uptime_24h || 0) >= 90
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {endpoint.uptime_24h?.toFixed(1) || 0}% uptime
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <p className="text-xs text-muted-foreground text-center">
        Last updated: {new Date().toLocaleString()}
      </p>
    </div>
  );
}

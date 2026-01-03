import { createClient } from "@/lib/supabase/server";
import { EndpointCard } from "@/components/endpoints/endpoint-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const revalidate = 60;

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
      "id, resource_url, description, category, network, price_micro_usdc, uptime_24h, avg_latency_ms, is_active"
    )
    .eq("is_active", true)
    .not("uptime_24h", "is", null)
    .order("uptime_24h", { ascending: false })
    .limit(6);

  // Fetch network stats
  const { data: networkStats } = await supabase
    .from("endpoints")
    .select("network")
    .eq("is_active", true);

  const networks = networkStats?.reduce((acc, e) => {
    const net = e.network || "unknown";
    acc[net] = (acc[net] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const avgUptime =
    healthyEndpoints && totalEndpoints
      ? ((healthyEndpoints / totalEndpoints) * 100).toFixed(0)
      : "0";

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="pt-8 pb-4">
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight gradient-text">
              x402 Intelligence Layer
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Find the best endpoint for any task. We index {totalEndpoints?.toLocaleString() || "1,400+"}
              x402 endpoints and track uptime, latency, and pricing in real-time.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/endpoints"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Endpoints
            </Link>
            <a
              href="https://github.com/ntombisol/clarityx402"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-secondary text-secondary-foreground font-medium rounded-lg border border-border hover:bg-secondary/80 transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Endpoints"
          value={totalEndpoints?.toLocaleString() || "0"}
          showLive
        />
        <StatCard
          label="Healthy"
          value={healthyEndpoints?.toLocaleString() || "0"}
          subtext="95%+ uptime"
        />
        <StatCard
          label="Ecosystem Health"
          value={`${avgUptime}%`}
          showLive
        />
        <StatCard
          label="Networks"
          value={Object.keys(networks).length.toString()}
        />
      </section>

      {/* Networks */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Networks
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(networks)
            .sort((a, b) => b[1] - a[1])
            .map(([network, count]) => (
              <Link
                key={network}
                href={`/endpoints?network=${network}`}
                className="group"
              >
                <Badge
                  variant="outline"
                  className="px-3 py-1.5 text-sm capitalize cursor-pointer border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  {network}
                  <span className="ml-2 text-muted-foreground group-hover:text-primary transition-colors">
                    {count}
                  </span>
                </Badge>
              </Link>
            ))}
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Categories
          </h2>
          <Link
            href="/categories"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories?.map((category) => (
            <Link
              key={category.slug}
              href={`/endpoints?category=${category.slug}`}
              className="group"
            >
              <Badge
                variant="secondary"
                className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {category.name}
                <span className="ml-2 text-muted-foreground group-hover:text-primary/70">
                  {category.endpoint_count}
                </span>
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Endpoints */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Top Endpoints</h2>
          <Link
            href="/endpoints?sort=uptime"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
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
              network={endpoint.network}
              priceMicroUsdc={endpoint.price_micro_usdc}
              uptime24h={endpoint.uptime_24h}
              avgLatencyMs={endpoint.avg_latency_ms}
              isActive={endpoint.is_active}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  showLive,
}: {
  label: string;
  value: string;
  subtext?: string;
  showLive?: boolean;
}) {
  return (
    <Card className="border-border/50 bg-card/50 hover:border-border transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          {showLive && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-dot" />
              <span className="text-xs text-green-500/80">live</span>
            </span>
          )}
        </div>
        <p className="text-3xl font-bold tracking-tight mt-1">{value}</p>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
}

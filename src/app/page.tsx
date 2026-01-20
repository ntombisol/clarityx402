import { createClient } from "@/lib/supabase/server";
import { EndpointCard } from "@/components/endpoints/endpoint-card";
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

  // Fetch network stats using efficient RPC function
  const { data: networkCounts } = await supabase.rpc("get_network_counts") as {
    data: Array<{ network: string; count: number }> | null;
  };

  const networks: Record<string, number> = {};
  if (networkCounts) {
    for (const row of networkCounts) {
      networks[row.network] = Number(row.count);
    }
  }

  const avgUptime =
    healthyEndpoints && totalEndpoints
      ? ((healthyEndpoints / totalEndpoints) * 100).toFixed(0)
      : "0";

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative pt-8 pb-4">
        {/* Decorative elements */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-primary/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-8">
          {/* Badge */}
          <div className="animate-fade-in-up opacity-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
              <span className="text-xs font-medium text-primary">
                {totalEndpoints?.toLocaleString() || "1,400+"} endpoints indexed
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-4 animate-fade-in-up opacity-0 delay-100">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight">
              <span className="text-gradient">x402 Intelligence</span>
              <br />
              <span className="text-foreground">Layer</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Open source price and quality intelligence for x402. Compare
              endpoint pricing, uptime, and latency—so your agents always pick
              the best option for any task.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 animate-fade-in-up opacity-0 delay-200">
            <Link href="/endpoints" className="btn-neural inline-flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Browse Endpoints
            </Link>
            <a
              href="https://github.com/ntombisol/clarityx402"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost-neural inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="animate-fade-in-up opacity-0 delay-300">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Endpoints"
            value={totalEndpoints?.toLocaleString() || "0"}
            icon={<DatabaseIcon />}
            showLive
          />
          <StatCard
            label="Healthy"
            value={healthyEndpoints?.toLocaleString() || "0"}
            icon={<CheckIcon />}
            subtext="95%+ uptime"
            variant="success"
          />
          <StatCard
            label="Ecosystem Health"
            value={`${avgUptime}%`}
            icon={<HeartPulseIcon />}
            showLive
          />
          <StatCard
            label="Networks"
            value={Object.keys(networks).length.toString()}
            icon={<NetworkIcon />}
          />
        </div>
      </section>

      {/* Networks Section */}
      <section className="space-y-6 animate-fade-in-up opacity-0 delay-400">
        <SectionHeader title="Networks" />
        <div className="flex flex-wrap gap-3">
          {Object.entries(networks)
            .sort((a, b) => b[1] - a[1])
            .map(([network, count]) => (
              <Link key={network} href={`/endpoints?network=${network}`}>
                <NetworkBadge network={network} count={count} />
              </Link>
            ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="space-y-6 animate-fade-in-up opacity-0 delay-500">
        <div className="flex items-center justify-between">
          <SectionHeader title="Categories" />
          <Link
            href="/categories"
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            View all
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories?.map((category) => (
            <Link
              key={category.slug}
              href={`/endpoints?category=${category.slug}`}
              className="group"
            >
              <div className="card-neural p-4 h-full">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm group-hover:text-primary transition-colors">
                    {category.name}
                  </span>
                  <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                    {category.endpoint_count}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Endpoints Section */}
      <section className="space-y-6 animate-fade-in-up opacity-0 delay-600">
        <div className="flex items-center justify-between">
          <SectionHeader title="Top Endpoints" subtitle="By reliability" />
          <Link
            href="/endpoints?sort=uptime"
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            View all
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topEndpoints?.map((endpoint, index) => (
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
              rank={index + 1}
            />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="animate-fade-in-up opacity-0 delay-700">
        <div className="card-static p-8 sm:p-12 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="relative space-y-4">
            <h2 className="font-display text-2xl sm:text-3xl">
              Ready to find the best endpoint?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Compare pricing, uptime, and latency across the entire x402
              ecosystem.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link href="/compare" className="btn-neural inline-flex items-center gap-2">
                Compare Endpoints
              </Link>
              <Link href="/status" className="btn-ghost-neural inline-flex items-center gap-2">
                View System Status
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Components

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <h2 className="font-display text-xl">{title}</h2>
      {subtitle && (
        <span className="text-sm text-muted-foreground">{subtitle}</span>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  subtext,
  showLive,
  variant,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  subtext?: string;
  showLive?: boolean;
  variant?: "default" | "success";
}) {
  return (
    <div className="card-neural p-5 group">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`p-2 rounded-lg ${
            variant === "success"
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-primary/10 text-primary"
          }`}
        >
          {icon}
        </div>
        {showLive && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span className="text-[10px] uppercase tracking-wider text-emerald-500/80">
              Live
            </span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-3xl tracking-tight group-hover:text-gradient transition-all">
          {value}
        </p>
        {subtext && (
          <p className="text-xs text-muted-foreground/70">{subtext}</p>
        )}
      </div>
    </div>
  );
}

function NetworkBadge({ network, count }: { network: string; count: number }) {
  const networkClasses: Record<string, string> = {
    base: "badge-base",
    "base-sepolia": "badge-base-sepolia",
    solana: "badge-solana",
    polygon: "badge-polygon",
    ethereum: "badge-ethereum",
    arbitrum: "badge-arbitrum",
    optimism: "badge-optimism",
  };

  const badgeClass = networkClasses[network] || "border-border bg-secondary/50";

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${badgeClass} transition-all duration-300 hover:scale-105 cursor-pointer`}
    >
      <span className="capitalize font-medium text-sm">{network}</span>
      <span className="text-xs opacity-70">{count}</span>
    </div>
  );
}

// Icons
function DatabaseIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function HeartPulseIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M22 12h-4l-3 9L9 3l-3 9H2"
      />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
}

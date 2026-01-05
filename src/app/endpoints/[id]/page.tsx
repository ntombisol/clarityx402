import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

interface EndpointDetailPageProps {
  params: Promise<{ id: string }>;
}

const networkClasses: Record<string, string> = {
  base: "badge-base",
  "base-sepolia": "badge-base-sepolia",
  solana: "badge-solana",
  polygon: "badge-polygon",
  ethereum: "badge-ethereum",
  arbitrum: "badge-arbitrum",
  optimism: "badge-optimism",
};

export default async function EndpointDetailPage({
  params,
}: EndpointDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch endpoint
  const { data: endpoint, error } = await supabase
    .from("endpoints")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !endpoint) {
    notFound();
  }

  // Fetch recent pings for list
  const { data: recentPings } = await supabase
    .from("pings")
    .select("pinged_at, success, status_code, latency_ms, error_message")
    .eq("endpoint_id", id)
    .order("pinged_at", { ascending: false })
    .limit(20);

  // Fetch pings for uptime chart (last 24 hours, more granular)
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: chartPings } = await supabase
    .from("pings")
    .select("pinged_at, success, latency_ms")
    .eq("endpoint_id", id)
    .gte("pinged_at", last24h)
    .order("pinged_at", { ascending: true })
    .limit(100);

  // Fetch price history
  const { data: priceHistory } = await supabase
    .from("price_history")
    .select("recorded_at, price_micro_usdc")
    .eq("endpoint_id", id)
    .order("recorded_at", { ascending: false })
    .limit(30);

  const priceUsd = endpoint.price_micro_usdc
    ? (endpoint.price_micro_usdc / 1000000).toFixed(6)
    : null;

  const hostname = (() => {
    try {
      return new URL(endpoint.resource_url).hostname;
    } catch {
      return endpoint.resource_url;
    }
  })();

  const networkClass = endpoint.network
    ? networkClasses[endpoint.network] || "bg-secondary/50 border-border"
    : "";

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/endpoints"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          Endpoints
        </Link>
        <svg
          className="w-4 h-4 text-muted-foreground/50"
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
        <span className="text-foreground truncate max-w-[200px]">{hostname}</span>
      </nav>

      {/* Header Section */}
      <div className="card-static p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="relative space-y-4">
          {/* Status and URL */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl sm:text-3xl tracking-tight truncate">
                  {hostname}
                </h1>
                <span
                  className={`shrink-0 px-2.5 py-1 text-xs font-medium rounded-md ${
                    endpoint.is_active
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {endpoint.is_active ? "Online" : "Offline"}
                </span>
              </div>
              <p className="text-muted-foreground text-sm break-all">
                {endpoint.resource_url}
              </p>
            </div>

            {/* External link */}
            <a
              href={endpoint.resource_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost-neural inline-flex items-center gap-2 shrink-0"
            >
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
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Visit
            </a>
          </div>

          {/* Description */}
          <p className="text-foreground/80">
            {endpoint.description || "No description available"}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {endpoint.network && (
              <span
                className={`text-xs px-3 py-1 rounded-md capitalize ${networkClass}`}
              >
                {endpoint.network}
              </span>
            )}
            {endpoint.category && (
              <Link
                href={`/endpoints?category=${endpoint.category}`}
                className="text-xs px-3 py-1 rounded-md bg-secondary/80 text-muted-foreground border border-border/50 hover:text-primary hover:border-primary/30 transition-colors"
              >
                {endpoint.category}
              </Link>
            )}
            {endpoint.tags?.map((tag: string) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-md bg-secondary/50 text-muted-foreground border border-border/50"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Price"
          value={priceUsd ? `$${priceUsd}` : "—"}
          subtext="per request"
          icon={<DollarIcon />}
        />
        <MetricCard
          label="Uptime (24h)"
          value={endpoint.uptime_24h !== null ? `${endpoint.uptime_24h}%` : "—"}
          subtext={
            endpoint.uptime_7d !== null ? `7d: ${endpoint.uptime_7d}%` : undefined
          }
          icon={<UptimeIcon />}
          variant={
            endpoint.uptime_24h >= 99
              ? "success"
              : endpoint.uptime_24h >= 95
                ? "warning"
                : endpoint.uptime_24h !== null
                  ? "error"
                  : "default"
          }
        />
        <MetricCard
          label="Avg Latency"
          value={
            endpoint.avg_latency_ms !== null
              ? `${endpoint.avg_latency_ms}ms`
              : "—"
          }
          subtext={
            endpoint.p95_latency_ms !== null
              ? `P95: ${endpoint.p95_latency_ms}ms`
              : undefined
          }
          icon={<BoltIcon />}
          variant={
            endpoint.avg_latency_ms < 500
              ? "success"
              : endpoint.avg_latency_ms < 2000
                ? "warning"
                : endpoint.avg_latency_ms !== null
                  ? "error"
                  : "default"
          }
        />
        <MetricCard
          label="Error Rate"
          value={endpoint.error_rate !== null ? `${endpoint.error_rate}%` : "—"}
          subtext={`${endpoint.consecutive_failures || 0} consecutive failures`}
          icon={<AlertIcon />}
          variant={
            endpoint.error_rate === 0
              ? "success"
              : endpoint.error_rate < 5
                ? "warning"
                : endpoint.error_rate !== null
                  ? "error"
                  : "default"
          }
        />
      </div>

      {/* Uptime Chart */}
      {chartPings && chartPings.length > 0 && (
        <div className="card-static overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <h2 className="font-display text-lg flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Uptime & Latency (Last 24 Hours)
            </h2>
          </div>
          <div className="p-5">
            <UptimeChart pings={chartPings} />
          </div>
        </div>
      )}

      {/* Recent Health Checks */}
      <div className="card-static overflow-hidden">
        <div className="p-5 border-b border-border/50">
          <h2 className="font-display text-lg flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
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
            Recent Health Checks
          </h2>
        </div>
        <div className="divide-y divide-border/50">
          {recentPings && recentPings.length > 0 ? (
            recentPings.map((ping, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                      ping.success
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {ping.success ? "OK" : "ERR"}
                  </span>
                  <div>
                    <p className="text-sm font-mono text-muted-foreground">
                      {new Date(ping.pinged_at).toLocaleString()}
                    </p>
                    {ping.error_message && (
                      <p className="text-xs text-red-400 mt-0.5">
                        {ping.error_message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  {ping.status_code && (
                    <span className="font-mono text-muted-foreground">
                      HTTP {ping.status_code}
                    </span>
                  )}
                  {ping.latency_ms && (
                    <span
                      className={`font-mono ${
                        ping.latency_ms < 500
                          ? "text-emerald-400"
                          : ping.latency_ms < 2000
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}
                    >
                      {ping.latency_ms}ms
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No health check data available yet
            </div>
          )}
        </div>
      </div>

      {/* Price History */}
      {priceHistory && priceHistory.length > 0 && (
        <div className="card-static overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <h2 className="font-display text-lg flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Price History
            </h2>
          </div>
          <div className="divide-y divide-border/50">
            {priceHistory.map((record, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
              >
                <span className="text-sm font-mono text-muted-foreground">
                  {new Date(record.recorded_at).toLocaleDateString()}
                </span>
                <span className="font-mono text-foreground">
                  ${(record.price_micro_usdc / 1000000).toFixed(6)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Data */}
      <div className="card-static overflow-hidden">
        <div className="p-5 border-b border-border/50">
          <h2 className="font-display text-lg flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            Raw Bazaar Data
          </h2>
        </div>
        <div className="p-5">
          <pre className="text-xs font-mono bg-background/50 p-4 rounded-lg overflow-auto max-h-64 border border-border/50">
            {JSON.stringify(endpoint.bazaar_data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  icon,
  variant = "default",
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error";
}) {
  const variantClasses = {
    default: "text-foreground",
    success: "text-emerald-400",
    warning: "text-amber-400",
    error: "text-red-400",
  };

  const iconBgClasses = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-400",
    warning: "bg-amber-500/10 text-amber-400",
    error: "bg-red-500/10 text-red-400",
  };

  return (
    <div className="card-neural p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${iconBgClasses[variant]}`}>{icon}</div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className={`font-display text-2xl tracking-tight ${variantClasses[variant]}`}>
        {value}
      </p>
      {subtext && (
        <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>
      )}
    </div>
  );
}

// Icons
function DollarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function UptimeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

// Uptime Chart Component
function UptimeChart({
  pings,
}: {
  pings: { pinged_at: string; success: boolean; latency_ms: number | null }[];
}) {
  // Calculate max latency for scaling
  const maxLatency = Math.max(
    ...pings.map((p) => p.latency_ms || 0),
    1000 // minimum scale
  );

  // Calculate stats
  const successCount = pings.filter((p) => p.success).length;
  const uptimePercent = ((successCount / pings.length) * 100).toFixed(1);
  const avgLatency = Math.round(
    pings.reduce((sum, p) => sum + (p.latency_ms || 0), 0) / pings.length
  );

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-muted-foreground">
            Uptime: <span className="text-foreground font-medium">{uptimePercent}%</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-primary"></span>
          <span className="text-muted-foreground">
            Avg Latency: <span className="text-foreground font-medium">{avgLatency}ms</span>
          </span>
        </div>
        <span className="text-muted-foreground/60 text-xs">
          {pings.length} checks
        </span>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          <div className="border-t border-border/30 w-full"></div>
          <div className="border-t border-border/30 w-full"></div>
          <div className="border-t border-border/30 w-full"></div>
        </div>

        {/* Bars */}
        <div className="flex items-end gap-0.5 h-32 relative z-10">
          {pings.map((ping, i) => {
            const height = ping.latency_ms
              ? Math.max(4, (ping.latency_ms / maxLatency) * 100)
              : 4;
            const time = new Date(ping.pinged_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={i}
                className="flex-1 group relative"
                style={{ minWidth: "3px", maxWidth: "12px" }}
              >
                <div
                  className={`w-full rounded-t transition-all duration-200 ${
                    ping.success
                      ? "bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-emerald-300"
                      : "bg-gradient-to-t from-red-600 to-red-400 group-hover:from-red-500 group-hover:to-red-300"
                  }`}
                  style={{ height: `${height}%` }}
                ></div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-background border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                  <div className="font-medium">{time}</div>
                  <div className={ping.success ? "text-emerald-400" : "text-red-400"}>
                    {ping.success ? `${ping.latency_ms}ms` : "Failed"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-muted-foreground/60">
        <span>
          {new Date(pings[0]?.pinged_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span>Now</span>
      </div>
    </div>
  );
}

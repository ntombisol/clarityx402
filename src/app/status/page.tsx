import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const revalidate = 30;

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
    .select(
      "id, resource_url, description, category, uptime_24h, consecutive_failures, last_error_at"
    )
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

  const statusConfig = {
    operational: {
      label: "All Systems Operational",
      color: "emerald",
      icon: CheckIcon,
    },
    degraded: {
      label: "Partial System Degradation",
      color: "amber",
      icon: AlertIcon,
    },
    major_outage: {
      label: "Major Outage Detected",
      color: "red",
      icon: XIcon,
    },
  };

  const status = statusConfig[overallStatus];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
          System Status
        </h1>
        <p className="text-muted-foreground">
          Real-time health monitoring of the x402 ecosystem
        </p>
      </div>

      {/* Overall Status Banner */}
      <div
        className={`card-static p-6 relative overflow-hidden ${
          overallStatus === "operational"
            ? "border-emerald-500/30"
            : overallStatus === "degraded"
              ? "border-amber-500/30"
              : "border-red-500/30"
        }`}
      >
        {/* Background glow */}
        <div
          className={`absolute inset-0 ${
            overallStatus === "operational"
              ? "bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent"
              : overallStatus === "degraded"
                ? "bg-gradient-to-br from-amber-500/10 via-transparent to-transparent"
                : "bg-gradient-to-br from-red-500/10 via-transparent to-transparent"
          }`}
        />

        <div className="relative flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              overallStatus === "operational"
                ? "bg-emerald-500/20"
                : overallStatus === "degraded"
                  ? "bg-amber-500/20"
                  : "bg-red-500/20"
            }`}
          >
            <StatusIcon
              className={`w-7 h-7 ${
                overallStatus === "operational"
                  ? "text-emerald-400"
                  : overallStatus === "degraded"
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl">{status.label}</h2>
            <p className="text-sm text-muted-foreground">
              <span
                className={
                  parseFloat(successRate) >= 99
                    ? "text-emerald-400"
                    : parseFloat(successRate) >= 95
                      ? "text-amber-400"
                      : "text-red-400"
                }
              >
                {successRate}%
              </span>{" "}
              success rate in the last hour
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span className="text-xs text-muted-foreground font-mono">
              MONITORING
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatusCard
          label="Healthy"
          value={healthyEndpoints || 0}
          subtext="99%+ uptime"
          variant="success"
        />
        <StatusCard
          label="Degraded"
          value={degradedEndpoints || 0}
          subtext="90-99% uptime"
          variant="warning"
        />
        <StatusCard
          label="Down"
          value={downEndpoints || 0}
          subtext="<90% uptime"
          variant="error"
        />
        <StatusCard
          label="Inactive"
          value={inactiveEndpoints || 0}
          subtext="Not responding"
          variant="muted"
        />
        <StatusCard
          label="Pings/Hour"
          value={recentPings || 0}
          subtext={`${recentFailures || 0} failures`}
          variant="default"
        />
      </div>

      {/* Category Health */}
      <div className="card-static overflow-hidden">
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
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
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              />
            </svg>
            Category Health
          </h2>
        </div>
        <div className="p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories?.map((category) => {
              const health = categoryHealth[category.slug];
              const percentage =
                health && health.total > 0
                  ? ((health.healthy / health.total) * 100).toFixed(0)
                  : "100";
              const percentNum = parseInt(percentage);

              return (
                <Link
                  key={category.slug}
                  href={`/endpoints?category=${category.slug}`}
                  className="group"
                >
                  <div className="card-neural p-4 h-full">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm group-hover:text-primary transition-colors">
                        {category.name}
                      </span>
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded ${
                          percentNum >= 90
                            ? "bg-emerald-500/10 text-emerald-400"
                            : percentNum >= 70
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {percentage}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percentNum >= 90
                              ? "bg-emerald-500"
                              : percentNum >= 70
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {health?.healthy || 0}/{health?.total || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Current Issues */}
      {issueEndpoints && issueEndpoints.length > 0 && (
        <div className="card-static overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <h2 className="font-display text-lg flex items-center gap-2">
              <svg
                className="w-5 h-5 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Current Issues
            </h2>
          </div>
          <div className="divide-y divide-border/50">
            {issueEndpoints.map((endpoint) => {
              const hostname = (() => {
                try {
                  return new URL(endpoint.resource_url).hostname;
                } catch {
                  return endpoint.resource_url;
                }
              })();

              return (
                <Link
                  key={endpoint.id}
                  href={`/endpoints/${endpoint.id}`}
                  className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {hostname}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {endpoint.description || endpoint.category || "Unknown"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {endpoint.consecutive_failures > 0 && (
                      <span className="px-2 py-0.5 text-xs rounded bg-red-500/10 text-red-400 border border-red-500/20">
                        {endpoint.consecutive_failures} failures
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-xs rounded font-mono ${
                        (endpoint.uptime_24h || 0) >= 90
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {endpoint.uptime_24h?.toFixed(1) || 0}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
        <span className="w-1.5 h-1.5 rounded-full bg-primary/30 animate-pulse-dot" />
        <span className="font-mono">
          Auto-refreshes every 30 seconds
        </span>
      </div>
    </div>
  );
}

function StatusCard({
  label,
  value,
  subtext,
  variant,
}: {
  label: string;
  value: number;
  subtext: string;
  variant: "success" | "warning" | "error" | "muted" | "default";
}) {
  const variantConfig = {
    success: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
    },
    warning: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
    },
    error: {
      bg: "bg-red-500/10",
      text: "text-red-400",
      border: "border-red-500/20",
    },
    muted: {
      bg: "bg-secondary/50",
      text: "text-muted-foreground",
      border: "border-border/50",
    },
    default: {
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/20",
    },
  };

  const config = variantConfig[variant];

  return (
    <div className={`card-neural p-4 border ${config.border}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`font-display text-2xl ${config.text}`}>{value}</p>
      <p className="text-xs text-muted-foreground/70 mt-0.5">{subtext}</p>
    </div>
  );
}

// Icons
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

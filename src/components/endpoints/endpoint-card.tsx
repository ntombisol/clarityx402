import Link from "next/link";

interface EndpointCardProps {
  id: string;
  resourceUrl: string;
  description: string | null;
  category: string | null;
  network: string | null;
  priceMicroUsdc: number | null;
  uptime24h: number | null;
  avgLatencyMs: number | null;
  isActive: boolean;
  rank?: number;
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

function getUptimeConfig(uptime: number | null): {
  color: string;
  bgColor: string;
  label: string;
} {
  if (uptime === null)
    return {
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      label: "Unknown",
    };
  if (uptime >= 99)
    return {
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      label: "Excellent",
    };
  if (uptime >= 95)
    return {
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      label: "Good",
    };
  return {
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    label: "Poor",
  };
}

function getLatencyConfig(latency: number | null): {
  color: string;
  label: string;
} {
  if (latency === null)
    return { color: "text-muted-foreground", label: "Unknown" };
  if (latency < 500) return { color: "text-emerald-400", label: "Fast" };
  if (latency < 2000) return { color: "text-amber-400", label: "Medium" };
  return { color: "text-red-400", label: "Slow" };
}

export function EndpointCard({
  id,
  resourceUrl,
  description,
  category,
  network,
  priceMicroUsdc,
  uptime24h,
  avgLatencyMs,
  isActive,
  rank,
}: EndpointCardProps) {
  const priceUsd = priceMicroUsdc
    ? (priceMicroUsdc / 1000000).toFixed(4)
    : null;
  const hostname = (() => {
    try {
      return new URL(resourceUrl).hostname;
    } catch {
      return resourceUrl;
    }
  })();

  const uptimeConfig = getUptimeConfig(uptime24h);
  const latencyConfig = getLatencyConfig(avgLatencyMs);
  const networkClass = network
    ? networkClasses[network] || "bg-secondary/50 border-border"
    : "";

  return (
    <Link href={`/endpoints/${id}`} className="block group">
      <div className="card-neural h-full p-5 relative overflow-hidden">
        {/* Rank badge */}
        {typeof rank === "number" && rank > 0 ? (
          <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/20 to-transparent"></div>
            <span className="absolute top-1.5 right-2.5 text-xs font-display text-primary/80">
              #{rank}
            </span>
          </div>
        ) : null}

        {/* Header */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors duration-300">
                {hostname}
              </h3>
            </div>
            {!isActive && (
              <span className="shrink-0 px-2 py-0.5 text-xs rounded bg-red-500/10 text-red-400 border border-red-500/20">
                Offline
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {network && (
              <span
                className={`text-xs px-2 py-0.5 rounded capitalize ${networkClass}`}
              >
                {network}
              </span>
            )}
            {category && (
              <span className="text-xs px-2 py-0.5 rounded bg-secondary/80 text-muted-foreground border border-border/50">
                {category}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground mb-5 line-clamp-2 min-h-[2.5rem] leading-relaxed">
          {description || "No description available"}
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3 h-3 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Price
              </span>
            </div>
            <p className="text-sm font-medium font-mono">
              {priceUsd ? `$${priceUsd}` : "—"}
            </p>
          </div>

          {/* Uptime */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3 h-3 text-muted-foreground"
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
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Uptime
              </span>
            </div>
            <p className={`text-sm font-medium font-mono ${uptimeConfig.color}`}>
              {uptime24h !== null ? `${uptime24h}%` : "—"}
            </p>
          </div>

          {/* Latency */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3 h-3 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Latency
              </span>
            </div>
            <p className={`text-sm font-medium font-mono ${latencyConfig.color}`}>
              {avgLatencyMs !== null ? `${avgLatencyMs}ms` : "—"}
            </p>
          </div>
        </div>

        {/* Hover indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </Link>
  );
}

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
}

const networkColors: Record<string, string> = {
  base: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "base-sepolia": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  solana: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  polygon: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  ethereum: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  arbitrum: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  optimism: "bg-red-500/10 text-red-400 border-red-500/20",
};

function getUptimeColor(uptime: number | null): string {
  if (uptime === null) return "text-muted-foreground";
  if (uptime >= 99) return "text-green-400";
  if (uptime >= 95) return "text-yellow-400";
  return "text-red-400";
}

function getLatencyColor(latency: number | null): string {
  if (latency === null) return "text-muted-foreground";
  if (latency < 500) return "text-green-400";
  if (latency < 2000) return "text-yellow-400";
  return "text-red-400";
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
}: EndpointCardProps) {
  const priceUsd = priceMicroUsdc ? (priceMicroUsdc / 1000000).toFixed(4) : null;
  const hostname = (() => {
    try {
      return new URL(resourceUrl).hostname;
    } catch {
      return resourceUrl;
    }
  })();

  return (
    <Link href={`/endpoints/${id}`}>
      <Card className="h-full border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-300 card-hover cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {hostname}
              </p>
            </div>
            {!isActive && (
              <Badge variant="destructive" className="text-xs shrink-0">
                Offline
              </Badge>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap mt-2">
            {network && (
              <Badge
                variant="outline"
                className={`text-xs capitalize ${networkColors[network] || "border-border"}`}
              >
                {network}
              </Badge>
            )}
            {category && (
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
            {description || "No description available"}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Price</p>
              <p className="text-sm font-medium">
                {priceUsd ? `$${priceUsd}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Uptime</p>
              <p className={`text-sm font-medium ${getUptimeColor(uptime24h)}`}>
                {uptime24h !== null ? `${uptime24h}%` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Latency</p>
              <p className={`text-sm font-medium ${getLatencyColor(avgLatencyMs)}`}>
                {avgLatencyMs !== null ? `${avgLatencyMs}ms` : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

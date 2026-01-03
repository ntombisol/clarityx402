import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  base: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  solana: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  polygon: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  ethereum: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

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

  return (
    <Link href={`/endpoints/${id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-sm font-medium truncate max-w-[80%]">
              {new URL(resourceUrl).hostname}
            </CardTitle>
            {!isActive && (
              <Badge variant="destructive" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>
          <div className="flex gap-1 flex-wrap">
            {network && (
              <Badge
                variant="outline"
                className={`w-fit text-xs capitalize ${networkColors[network] || ""}`}
              >
                {network}
              </Badge>
            )}
            {category && (
              <Badge variant="secondary" className="w-fit text-xs">
                {category}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {description || "No description available"}
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Price</p>
              <p className="font-medium">
                {priceUsd ? `$${priceUsd}` : "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Uptime</p>
              <p className="font-medium">
                {uptime24h !== null ? `${uptime24h}%` : "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Latency</p>
              <p className="font-medium">
                {avgLatencyMs !== null ? `${avgLatencyMs}ms` : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

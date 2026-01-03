import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface EndpointCardProps {
  id: string;
  resourceUrl: string;
  description: string | null;
  category: string | null;
  priceMicroUsdc: number | null;
  uptime24h: number | null;
  avgLatencyMs: number | null;
  isActive: boolean;
}

export function EndpointCard({
  id,
  resourceUrl,
  description,
  category,
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
          {category && (
            <Badge variant="secondary" className="w-fit text-xs">
              {category}
            </Badge>
          )}
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

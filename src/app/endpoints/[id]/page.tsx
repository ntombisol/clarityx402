import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { notFound } from "next/navigation";
import Link from "next/link";

interface EndpointDetailPageProps {
  params: Promise<{ id: string }>;
}

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

  // Fetch recent pings
  const { data: recentPings } = await supabase
    .from("pings")
    .select("pinged_at, success, status_code, latency_ms, error_message")
    .eq("endpoint_id", id)
    .order("pinged_at", { ascending: false })
    .limit(20);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/endpoints"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Endpoints
            </Link>
            <span className="text-muted-foreground">/</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight break-all">
            {endpoint.resource_url}
          </h1>
          <p className="text-muted-foreground mt-1">
            {endpoint.description || "No description available"}
          </p>
        </div>
        <Badge variant={endpoint.is_active ? "default" : "destructive"}>
          {endpoint.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-2">
        {endpoint.category && (
          <Badge variant="secondary">{endpoint.category}</Badge>
        )}
        {endpoint.tags?.map((tag: string) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
        {endpoint.network && (
          <Badge variant="outline">Network: {endpoint.network}</Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {priceUsd ? `$${priceUsd}` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">per request</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Uptime (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {endpoint.uptime_24h !== null ? `${endpoint.uptime_24h}%` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              7d: {endpoint.uptime_7d !== null ? `${endpoint.uptime_7d}%` : "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {endpoint.avg_latency_ms !== null
                ? `${endpoint.avg_latency_ms}ms`
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              P95:{" "}
              {endpoint.p95_latency_ms !== null
                ? `${endpoint.p95_latency_ms}ms`
                : "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {endpoint.error_rate !== null ? `${endpoint.error_rate}%` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              Failures: {endpoint.consecutive_failures || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Recent Pings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Health Checks</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPings && recentPings.length > 0 ? (
            <div className="space-y-2">
              {recentPings.map((ping, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={ping.success ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {ping.success ? "OK" : "FAIL"}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(ping.pinged_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    {ping.status_code && <span>HTTP {ping.status_code}</span>}
                    {ping.latency_ms && <span>{ping.latency_ms}ms</span>}
                    {ping.error_message && (
                      <span className="text-destructive text-xs">
                        {ping.error_message}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No health check data available yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Price History */}
      {priceHistory && priceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Price History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {priceHistory.map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                >
                  <span className="text-muted-foreground">
                    {new Date(record.recorded_at).toLocaleDateString()}
                  </span>
                  <span className="font-medium">
                    ${(record.price_micro_usdc / 1000000).toFixed(6)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Data */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Bazaar Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
            {JSON.stringify(endpoint.bazaar_data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

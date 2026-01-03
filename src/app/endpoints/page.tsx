import { createClient } from "@/lib/supabase/server";
import { EndpointCard } from "@/components/endpoints/endpoint-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const revalidate = 60;

interface EndpointsPageProps {
  searchParams: Promise<{
    category?: string;
    network?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function EndpointsPage({ searchParams }: EndpointsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Fetch categories for filter
  const { data: categories } = await supabase
    .from("categories")
    .select("slug, name, endpoint_count")
    .order("endpoint_count", { ascending: false });

  // Fetch all unique networks
  const { data: networkData } = await supabase
    .from("endpoints")
    .select("network")
    .eq("is_active", true);

  const uniqueNetworks = [...new Set(networkData?.map(e => e.network).filter(Boolean) || [])];

  // Build query
  let query = supabase
    .from("endpoints")
    .select(
      "id, resource_url, description, category, network, price_micro_usdc, uptime_24h, avg_latency_ms, is_active"
    )
    .eq("is_active", true);

  if (params.category) {
    query = query.eq("category", params.category);
  }

  if (params.network) {
    query = query.eq("network", params.network);
  }

  if (params.search) {
    query = query.or(
      `description.ilike.%${params.search}%,resource_url.ilike.%${params.search}%`
    );
  }

  // Apply sorting
  const sortColumn = params.sort === "price"
    ? "price_micro_usdc"
    : params.sort === "latency"
    ? "avg_latency_ms"
    : "uptime_24h";

  query = query.order(sortColumn, {
    ascending: params.sort === "price" || params.sort === "latency",
    nullsFirst: false
  });

  const { data: endpoints, count } = await query.limit(50);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Endpoints</h1>
        <p className="text-muted-foreground mt-1">
          Browse all indexed x402 endpoints
        </p>
      </div>

      {/* Filters Section */}
      <div className="space-y-4">
        {/* Network filters */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Network
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/endpoints?${new URLSearchParams({ ...params, network: "" }).toString()}`}>
              <Badge
                variant={!params.network ? "default" : "outline"}
                className="cursor-pointer px-3 py-1"
              >
                All
              </Badge>
            </Link>
            {uniqueNetworks.sort().map((network) => (
              <Link
                key={network}
                href={`/endpoints?${new URLSearchParams({ ...params, network }).toString()}`}
              >
                <Badge
                  variant={params.network === network ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1 capitalize"
                >
                  {network}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Category filters */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Category
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/endpoints?${new URLSearchParams({ ...params, category: "" }).toString()}`}>
              <Badge
                variant={!params.category ? "default" : "outline"}
                className="cursor-pointer px-3 py-1"
              >
                All
              </Badge>
            </Link>
            {categories?.map((category) => (
              <Link
                key={category.slug}
                href={`/endpoints?${new URLSearchParams({ ...params, category: category.slug }).toString()}`}
              >
                <Badge
                  variant={params.category === category.slug ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1"
                >
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Sort options */}
        <div className="flex items-center gap-4 pt-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Sort
          </p>
          <div className="flex gap-1">
            {[
              { key: "uptime", label: "Uptime" },
              { key: "price", label: "Price" },
              { key: "latency", label: "Latency" },
            ].map((option) => (
              <Link
                key={option.key}
                href={`/endpoints?${new URLSearchParams({ ...params, sort: option.key }).toString()}`}
              >
                <Badge
                  variant={
                    params.sort === option.key || (!params.sort && option.key === "uptime")
                      ? "secondary"
                      : "outline"
                  }
                  className="cursor-pointer px-3 py-1 border-transparent"
                >
                  {option.label}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {endpoints?.length || 0} endpoints
          {params.category && ` in ${params.category}`}
          {params.network && ` on ${params.network}`}
        </p>

        {endpoints && endpoints.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {endpoints.map((endpoint) => (
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
        ) : (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">No endpoints found</p>
            {(params.category || params.network) && (
              <Link href="/endpoints" className="text-sm text-primary mt-2 block hover:underline">
                Clear filters
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

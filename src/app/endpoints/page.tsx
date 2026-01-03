import { createClient } from "@/lib/supabase/server";
import { EndpointCard } from "@/components/endpoints/endpoint-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export const revalidate = 60;

interface EndpointsPageProps {
  searchParams: Promise<{
    category?: string;
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

  // Build query
  let query = supabase
    .from("endpoints")
    .select(
      "id, resource_url, description, category, price_micro_usdc, uptime_24h, avg_latency_ms, is_active"
    )
    .eq("is_active", true);

  if (params.category) {
    query = query.eq("category", params.category);
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

  const { data: endpoints } = await query.limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Endpoints</h1>
        <p className="text-muted-foreground">
          Browse and search all indexed x402 endpoints
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Search */}
        <form className="flex-1 max-w-sm">
          <Input
            type="search"
            name="search"
            placeholder="Search endpoints..."
            defaultValue={params.search}
          />
        </form>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <Link href="/endpoints">
            <Badge
              variant={!params.category ? "default" : "outline"}
              className="cursor-pointer"
            >
              All
            </Badge>
          </Link>
          {categories?.map((category) => (
            <Link
              key={category.slug}
              href={`/endpoints?category=${category.slug}`}
            >
              <Badge
                variant={params.category === category.slug ? "default" : "outline"}
                className="cursor-pointer"
              >
                {category.name}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Sort options */}
      <div className="flex gap-2 text-sm">
        <span className="text-muted-foreground">Sort by:</span>
        <Link
          href={`/endpoints?${new URLSearchParams({ ...params, sort: "uptime" }).toString()}`}
          className={params.sort !== "price" && params.sort !== "latency" ? "font-medium" : "text-muted-foreground"}
        >
          Uptime
        </Link>
        <Link
          href={`/endpoints?${new URLSearchParams({ ...params, sort: "price" }).toString()}`}
          className={params.sort === "price" ? "font-medium" : "text-muted-foreground"}
        >
          Price
        </Link>
        <Link
          href={`/endpoints?${new URLSearchParams({ ...params, sort: "latency" }).toString()}`}
          className={params.sort === "latency" ? "font-medium" : "text-muted-foreground"}
        >
          Latency
        </Link>
      </div>

      {/* Endpoints Grid */}
      {endpoints && endpoints.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {endpoints.map((endpoint) => (
            <EndpointCard
              key={endpoint.id}
              id={endpoint.id}
              resourceUrl={endpoint.resource_url}
              description={endpoint.description}
              category={endpoint.category}
              priceMicroUsdc={endpoint.price_micro_usdc}
              uptime24h={endpoint.uptime_24h}
              avgLatencyMs={endpoint.avg_latency_ms}
              isActive={endpoint.is_active}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No endpoints found</p>
          {params.category && (
            <Link href="/endpoints" className="text-sm text-primary mt-2 block">
              Clear filters
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

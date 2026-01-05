import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const revalidate = 60;

interface ComparePageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
  }>;
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

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("slug, name, endpoint_count")
    .gt("endpoint_count", 0)
    .order("endpoint_count", { ascending: false });

  const selectedCategory = params.category || categories?.[0]?.slug;

  // Fetch endpoints for comparison
  let endpoints: {
    id: string;
    resource_url: string;
    description: string | null;
    price_micro_usdc: number | null;
    uptime_24h: number | null;
    avg_latency_ms: number | null;
    network: string | null;
  }[] = [];

  if (selectedCategory) {
    const { data } = await supabase
      .from("endpoints")
      .select(
        "id, resource_url, description, price_micro_usdc, uptime_24h, avg_latency_ms, network"
      )
      .eq("category", selectedCategory)
      .eq("is_active", true)
      .order(
        params.sort === "price"
          ? "price_micro_usdc"
          : params.sort === "latency"
            ? "avg_latency_ms"
            : "uptime_24h",
        { ascending: params.sort === "price" || params.sort === "latency" }
      )
      .limit(20);

    endpoints = data || [];
  }

  const selectedCategoryName =
    categories?.find((c) => c.slug === selectedCategory)?.name ||
    selectedCategory;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
          Compare Endpoints
        </h1>
        <p className="text-muted-foreground">
          Compare x402 endpoints side-by-side within a category
        </p>
      </div>

      {/* Category Selection */}
      <div className="card-static p-6 space-y-4">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
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
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            />
          </svg>
          Select Category
        </label>
        <div className="flex flex-wrap gap-2">
          {categories?.map((category) => (
            <Link
              key={category.slug}
              href={`/compare?category=${category.slug}${params.sort ? `&sort=${params.sort}` : ""}`}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                selectedCategory === category.slug
                  ? "bg-gradient-to-r from-primary to-accent text-primary-foreground glow-cyan"
                  : "bg-secondary/50 text-muted-foreground border border-border/50 hover:text-foreground hover:border-primary/30"
              }`}
            >
              {category.name}
              <span className="ml-2 opacity-60">({category.endpoint_count})</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      {selectedCategory && (
        <div className="flex items-center gap-4">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Sort by
          </label>
          <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 border border-border/50">
            {[
              { key: "uptime", label: "Best Uptime" },
              { key: "price", label: "Lowest Price" },
              { key: "latency", label: "Fastest" },
            ].map((option) => {
              const isActive =
                params.sort === option.key ||
                (!params.sort && option.key === "uptime");

              return (
                <Link
                  key={option.key}
                  href={`/compare?category=${selectedCategory}&sort=${option.key}`}
                  className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-md" />
                  )}
                  <span className="relative">{option.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {endpoints.length > 0 ? (
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
              {selectedCategoryName} Endpoints
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({endpoints.length} results)
              </span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-neural">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 w-12">#</th>
                  <th className="text-left p-4">Endpoint</th>
                  <th className="text-left p-4">Network</th>
                  <th className="text-right p-4">Price</th>
                  <th className="text-right p-4">Uptime</th>
                  <th className="text-right p-4">Latency</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((endpoint, index) => {
                  const hostname = (() => {
                    try {
                      return new URL(endpoint.resource_url).hostname;
                    } catch {
                      return endpoint.resource_url;
                    }
                  })();

                  const networkClass = endpoint.network
                    ? networkClasses[endpoint.network] ||
                      "bg-secondary/50 border-border"
                    : "";

                  return (
                    <tr
                      key={endpoint.id}
                      className="border-b border-border/30 hover:bg-secondary/30 transition-colors group"
                    >
                      {/* Rank */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-display ${
                            index === 0
                              ? "bg-primary/20 text-primary"
                              : index === 1
                                ? "bg-accent/20 text-accent"
                                : index === 2
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>

                      {/* Endpoint */}
                      <td className="p-4">
                        <Link
                          href={`/endpoints/${endpoint.id}`}
                          className="block group-hover:translate-x-1 transition-transform"
                        >
                          <span className="font-medium text-sm group-hover:text-primary transition-colors block truncate max-w-[280px]">
                            {hostname}
                          </span>
                          <span className="text-xs text-muted-foreground truncate block max-w-[280px]">
                            {endpoint.description || endpoint.resource_url}
                          </span>
                        </Link>
                      </td>

                      {/* Network */}
                      <td className="p-4">
                        {endpoint.network ? (
                          <span
                            className={`text-xs px-2 py-1 rounded capitalize ${networkClass}`}
                          >
                            {endpoint.network}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="p-4 text-right">
                        <span className="font-mono text-sm">
                          {endpoint.price_micro_usdc
                            ? `$${(endpoint.price_micro_usdc / 1000000).toFixed(4)}`
                            : "—"}
                        </span>
                      </td>

                      {/* Uptime */}
                      <td className="p-4 text-right">
                        {endpoint.uptime_24h !== null ? (
                          <span
                            className={`font-mono text-sm ${
                              endpoint.uptime_24h >= 99
                                ? "text-emerald-400"
                                : endpoint.uptime_24h >= 95
                                  ? "text-amber-400"
                                  : "text-red-400"
                            }`}
                          >
                            {endpoint.uptime_24h}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Latency */}
                      <td className="p-4 text-right">
                        {endpoint.avg_latency_ms !== null ? (
                          <span
                            className={`font-mono text-sm ${
                              endpoint.avg_latency_ms < 500
                                ? "text-emerald-400"
                                : endpoint.avg_latency_ms < 2000
                                  ? "text-amber-400"
                                  : "text-red-400"
                            }`}
                          >
                            {endpoint.avg_latency_ms}ms
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedCategory ? (
        <div className="card-static p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <svg
              className="w-6 h-6 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-muted-foreground">
            No endpoints found in this category
          </p>
        </div>
      ) : (
        <div className="card-static p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
              />
            </svg>
          </div>
          <p className="text-muted-foreground">
            Select a category to compare endpoints
          </p>
        </div>
      )}
    </div>
  );
}

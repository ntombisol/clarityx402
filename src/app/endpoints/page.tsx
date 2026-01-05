import { createClient } from "@/lib/supabase/server";
import { EndpointCard } from "@/components/endpoints/endpoint-card";
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

const networkClasses: Record<string, string> = {
  base: "badge-base",
  "base-sepolia": "badge-base-sepolia",
  solana: "badge-solana",
  polygon: "badge-polygon",
  ethereum: "badge-ethereum",
  arbitrum: "badge-arbitrum",
  optimism: "badge-optimism",
};

export default async function EndpointsPage({
  searchParams,
}: EndpointsPageProps) {
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

  const uniqueNetworks = [
    ...new Set(networkData?.map((e) => e.network).filter(Boolean) || []),
  ];

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
  const sortColumn =
    params.sort === "price"
      ? "price_micro_usdc"
      : params.sort === "latency"
        ? "avg_latency_ms"
        : "uptime_24h";

  query = query.order(sortColumn, {
    ascending: params.sort === "price" || params.sort === "latency",
    nullsFirst: false,
  });

  const { data: endpoints } = await query.limit(50);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
          Endpoints
        </h1>
        <p className="text-muted-foreground">
          Browse all indexed x402 endpoints across the ecosystem
        </p>
      </div>

      {/* Filters Panel */}
      <div className="card-static p-6 space-y-6">
        {/* Network filters */}
        <div className="space-y-3">
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
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
            Network
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              href={`/endpoints?${buildParams(params, { network: "" })}`}
              active={!params.network}
            >
              All Networks
            </FilterChip>
            {uniqueNetworks.sort().map((network) => (
              <FilterChip
                key={network}
                href={`/endpoints?${buildParams(params, { network })}`}
                active={params.network === network}
                variant={network}
              >
                {network}
              </FilterChip>
            ))}
          </div>
        </div>

        {/* Category filters */}
        <div className="space-y-3">
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
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              href={`/endpoints?${buildParams(params, { category: "" })}`}
              active={!params.category}
            >
              All Categories
            </FilterChip>
            {categories?.map((category) => (
              <FilterChip
                key={category.slug}
                href={`/endpoints?${buildParams(params, { category: category.slug })}`}
                active={params.category === category.slug}
              >
                {category.name}
                <span className="ml-1.5 text-muted-foreground/60">
                  {category.endpoint_count}
                </span>
              </FilterChip>
            ))}
          </div>
        </div>

        {/* Sort options */}
        <div className="flex items-center gap-4 pt-2 border-t border-border/50">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Sort by
          </label>
          <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 border border-border/50">
            {[
              { key: "uptime", label: "Best Uptime", icon: CheckIcon },
              { key: "price", label: "Lowest Price", icon: DollarIcon },
              { key: "latency", label: "Fastest", icon: BoltIcon },
            ].map((option) => {
              const isActive =
                params.sort === option.key ||
                (!params.sort && option.key === "uptime");
              const Icon = option.icon;

              return (
                <Link
                  key={option.key}
                  href={`/endpoints?${buildParams(params, { sort: option.key })}`}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-md" />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {option.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">
              {endpoints?.length || 0}
            </span>{" "}
            endpoints
            {params.category && (
              <span>
                {" "}
                in{" "}
                <span className="text-primary">
                  {categories?.find((c) => c.slug === params.category)?.name ||
                    params.category}
                </span>
              </span>
            )}
            {params.network && (
              <span>
                {" "}
                on <span className="text-primary capitalize">{params.network}</span>
              </span>
            )}
          </p>

          {(params.category || params.network) && (
            <Link
              href="/endpoints"
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear filters
            </Link>
          )}
        </div>

        {/* Grid */}
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
            <p className="text-muted-foreground mb-2">No endpoints found</p>
            {(params.category || params.network) && (
              <Link
                href="/endpoints"
                className="text-sm text-primary hover:underline"
              >
                Clear filters
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to build URL params
function buildParams(
  current: Record<string, string | undefined>,
  updates: Record<string, string>
) {
  const params = new URLSearchParams();
  const merged = { ...current, ...updates };

  Object.entries(merged).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  return params.toString();
}

// Filter chip component
function FilterChip({
  href,
  active,
  variant,
  children,
}: {
  href: string;
  active: boolean;
  variant?: string;
  children: React.ReactNode;
}) {
  const networkClasses: Record<string, string> = {
    base: "badge-base",
    "base-sepolia": "badge-base-sepolia",
    solana: "badge-solana",
    polygon: "badge-polygon",
    ethereum: "badge-ethereum",
    arbitrum: "badge-arbitrum",
    optimism: "badge-optimism",
  };

  const baseClasses =
    "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 capitalize";

  if (active) {
    return (
      <Link
        href={href}
        className={`${baseClasses} bg-gradient-to-r from-primary to-accent text-primary-foreground glow-cyan`}
      >
        {children}
      </Link>
    );
  }

  if (variant && networkClasses[variant]) {
    return (
      <Link
        href={href}
        className={`${baseClasses} ${networkClasses[variant]} hover:scale-105`}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`${baseClasses} bg-secondary/50 text-muted-foreground border border-border/50 hover:text-foreground hover:border-primary/30`}
    >
      {children}
    </Link>
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

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}

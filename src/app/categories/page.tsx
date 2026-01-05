import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const revalidate = 60;

const categoryIcons: Record<string, React.ReactNode> = {
  "llm-inference": <BotIcon />,
  "image-generation": <ImageIcon />,
  "data-feeds": <ChartIcon />,
  security: <ShieldIcon />,
  search: <SearchIcon />,
  utilities: <WrenchIcon />,
  defi: <CoinsIcon />,
  social: <UsersIcon />,
};

export default async function CategoriesPage() {
  const supabase = await createClient();

  // Fetch categories with counts
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("endpoint_count", { ascending: false });

  // Fetch sample endpoints for each category
  const categoryEndpoints: Record<
    string,
    { id: string; resource_url: string; uptime_24h: number | null }[]
  > = {};

  if (categories) {
    for (const category of categories) {
      const { data: endpoints } = await supabase
        .from("endpoints")
        .select("id, resource_url, uptime_24h")
        .eq("category", category.slug)
        .eq("is_active", true)
        .order("uptime_24h", { ascending: false })
        .limit(3);

      categoryEndpoints[category.slug] = endpoints || [];
    }
  }

  // Get total stats
  const { count: totalEndpoints } = await supabase
    .from("endpoints")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: uncategorized } = await supabase
    .from("endpoints")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .is("category", null);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
          Categories
        </h1>
        <p className="text-muted-foreground">
          Browse x402 endpoints by service category
        </p>
      </div>

      {/* Summary Stats */}
      <div className="flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">
              {totalEndpoints || 0}
            </span>{" "}
            total endpoints
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">
              {categories?.length || 0}
            </span>{" "}
            categories
          </span>
        </div>
        {uncategorized && uncategorized > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">{uncategorized}</span>{" "}
              uncategorized
            </span>
          </div>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {categories?.map((category) => {
          const icon = categoryIcons[category.slug] || <BoxIcon />;
          const endpoints = categoryEndpoints[category.slug] || [];

          return (
            <div
              key={category.slug}
              className="card-neural p-6 group relative overflow-hidden"
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none" />

              {/* Header */}
              <div className="flex items-start justify-between mb-4 relative">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                    {icon}
                  </div>
                  <div>
                    <h2 className="font-display text-lg group-hover:text-primary transition-colors">
                      {category.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {category.endpoint_count} endpoints
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-5">
                {category.description}
              </p>

              {/* Top Endpoints */}
              {endpoints.length > 0 && (
                <div className="space-y-2 mb-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Top Endpoints
                  </p>
                  <div className="space-y-1.5">
                    {endpoints.map((endpoint) => {
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
                          className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded hover:bg-secondary/50 transition-colors group/item"
                        >
                          <span className="text-sm truncate group-hover/item:text-primary transition-colors">
                            {hostname}
                          </span>
                          {endpoint.uptime_24h !== null && (
                            <span
                              className={`text-xs font-mono ${
                                endpoint.uptime_24h >= 99
                                  ? "text-emerald-400"
                                  : endpoint.uptime_24h >= 95
                                    ? "text-amber-400"
                                    : "text-red-400"
                              }`}
                            >
                              {endpoint.uptime_24h}%
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border/50">
                <Link
                  href={`/endpoints?category=${category.slug}`}
                  className="flex-1 btn-ghost-neural text-center text-sm py-2"
                >
                  Browse All
                </Link>
                <Link
                  href={`/compare?category=${category.slug}`}
                  className="flex-1 btn-neural text-center text-sm py-2"
                >
                  Compare
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Icons
function BotIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function CoinsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

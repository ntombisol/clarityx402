import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export const revalidate = 60;

interface ComparePageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
  }>;
}

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compare Endpoints</h1>
        <p className="text-muted-foreground">
          Compare x402 endpoints side-by-side within a category
        </p>
      </div>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories?.map((category) => (
              <Link
                key={category.slug}
                href={`/compare?category=${category.slug}`}
              >
                <Badge
                  variant={
                    selectedCategory === category.slug ? "default" : "outline"
                  }
                  className="cursor-pointer"
                >
                  {category.name} ({category.endpoint_count})
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sort Options */}
      {selectedCategory && (
        <div className="flex gap-2 text-sm">
          <span className="text-muted-foreground">Sort by:</span>
          <Link
            href={`/compare?category=${selectedCategory}&sort=uptime`}
            className={
              params.sort !== "price" && params.sort !== "latency"
                ? "font-medium"
                : "text-muted-foreground"
            }
          >
            Best Uptime
          </Link>
          <Link
            href={`/compare?category=${selectedCategory}&sort=price`}
            className={
              params.sort === "price" ? "font-medium" : "text-muted-foreground"
            }
          >
            Lowest Price
          </Link>
          <Link
            href={`/compare?category=${selectedCategory}&sort=latency`}
            className={
              params.sort === "latency"
                ? "font-medium"
                : "text-muted-foreground"
            }
          >
            Fastest
          </Link>
        </div>
      )}

      {/* Comparison Table */}
      {endpoints.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {categories?.find((c) => c.slug === selectedCategory)?.name}{" "}
              Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Uptime</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((endpoint, index) => (
                  <TableRow key={endpoint.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <Link
                        href={`/endpoints/${endpoint.id}`}
                        className="hover:underline"
                      >
                        <div className="font-medium truncate max-w-[300px]">
                          {new URL(endpoint.resource_url).hostname}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {endpoint.description || endpoint.resource_url}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{endpoint.network || "-"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {endpoint.price_micro_usdc
                        ? `$${(endpoint.price_micro_usdc / 1000000).toFixed(4)}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {endpoint.uptime_24h !== null ? (
                        <span
                          className={
                            endpoint.uptime_24h >= 99
                              ? "text-green-600"
                              : endpoint.uptime_24h >= 95
                              ? "text-yellow-600"
                              : "text-red-600"
                          }
                        >
                          {endpoint.uptime_24h}%
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {endpoint.avg_latency_ms !== null
                        ? `${endpoint.avg_latency_ms}ms`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : selectedCategory ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No endpoints found in this category
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Select a category to compare endpoints
          </CardContent>
        </Card>
      )}
    </div>
  );
}

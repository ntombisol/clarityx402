import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const task = searchParams.get("task"); // Category or description of task
  const budget = searchParams.get("budget"); // Max price in micro USDC
  const minUptime = searchParams.get("min_uptime") || "90"; // Minimum uptime %

  if (!task) {
    return NextResponse.json(
      { error: "Task parameter is required" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    // Build query for endpoints matching the task
    let query = supabase
      .from("endpoints")
      .select(
        `
        id,
        resource_url,
        description,
        price_micro_usdc,
        network,
        category,
        uptime_24h,
        uptime_7d,
        avg_latency_ms,
        tags,
        last_seen_at
      `
      )
      .eq("is_active", true)
      .gte("uptime_24h", parseFloat(minUptime));

    // Check if task is a category
    const { data: categories } = await supabase
      .from("categories")
      .select("slug")
      .eq("slug", task);

    if (categories && categories.length > 0) {
      // Task is a category
      query = query.eq("category", task);
    } else {
      // Task is a description - search
      query = query.or(
        `description.ilike.%${task}%,category.ilike.%${task}%,tags.cs.{${task}}`
      );
    }

    // Apply budget filter
    if (budget) {
      query = query.lte("price_micro_usdc", parseInt(budget));
    }

    const { data: endpoints, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!endpoints || endpoints.length === 0) {
      return NextResponse.json({
        recommendation: null,
        message: "No endpoints found matching your criteria",
        suggestions: [
          "Try a different task category",
          "Increase your budget",
          "Lower the minimum uptime requirement",
        ],
      });
    }

    // Score and rank endpoints
    const scored = endpoints
      .map((endpoint) => ({
        ...endpoint,
        score: calculateRecommendationScore(endpoint, budget ? parseInt(budget) : null),
      }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    const alternatives = scored.slice(1, 4);

    // Generate reasoning
    const reasoning = generateReasoning(best, alternatives, task, budget);

    return NextResponse.json({
      recommendation: {
        endpoint: best,
        reasoning,
      },
      alternatives: alternatives.map((alt, index) => ({
        rank: index + 2,
        endpoint: alt,
      })),
      totalMatches: endpoints.length,
    });
  } catch (error) {
    console.error("[API/recommend] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

interface EndpointForScoring {
  uptime_24h: number | null;
  avg_latency_ms: number | null;
  price_micro_usdc: number | null;
}

function calculateRecommendationScore(
  endpoint: EndpointForScoring,
  maxBudget: number | null
): number {
  let score = 0;

  // Uptime is critical (50 points max)
  if (endpoint.uptime_24h !== null) {
    score += (endpoint.uptime_24h / 100) * 50;
  }

  // Latency matters (25 points max)
  if (endpoint.avg_latency_ms !== null) {
    const latencyScore = Math.max(0, 1 - endpoint.avg_latency_ms / 2000);
    score += latencyScore * 25;
  }

  // Price efficiency (25 points max)
  if (endpoint.price_micro_usdc !== null && maxBudget) {
    // Better score if well under budget
    const priceRatio = endpoint.price_micro_usdc / maxBudget;
    const priceScore = Math.max(0, 1 - priceRatio);
    score += priceScore * 25;
  } else if (endpoint.price_micro_usdc !== null) {
    // If no budget, lower price is better
    const priceScore = Math.max(0, 1 - endpoint.price_micro_usdc / 1000000);
    score += priceScore * 25;
  }

  return Math.round(score * 100) / 100;
}

interface RecommendedEndpoint {
  resource_url: string;
  uptime_24h: number | null;
  avg_latency_ms: number | null;
  price_micro_usdc: number | null;
  description: string | null;
}

function generateReasoning(
  best: RecommendedEndpoint,
  alternatives: RecommendedEndpoint[],
  task: string,
  budget: string | null
): string[] {
  const reasons: string[] = [];

  reasons.push(`Best match for "${task}" based on quality and value.`);

  if (best.uptime_24h !== null && best.uptime_24h >= 99) {
    reasons.push(`Excellent reliability with ${best.uptime_24h}% uptime.`);
  } else if (best.uptime_24h !== null && best.uptime_24h >= 95) {
    reasons.push(`Good reliability with ${best.uptime_24h}% uptime.`);
  }

  if (best.avg_latency_ms !== null && best.avg_latency_ms < 200) {
    reasons.push(`Fast response time (${best.avg_latency_ms}ms average).`);
  }

  if (best.price_micro_usdc !== null) {
    const priceUsd = best.price_micro_usdc / 1000000;
    reasons.push(`Priced at $${priceUsd.toFixed(4)} per request.`);

    if (budget) {
      const budgetUsd = parseInt(budget) / 1000000;
      if (priceUsd < budgetUsd * 0.5) {
        reasons.push(`Well under your $${budgetUsd.toFixed(4)} budget.`);
      }
    }
  }

  if (alternatives.length > 0) {
    reasons.push(
      `${alternatives.length} alternative${alternatives.length > 1 ? "s" : ""} available.`
    );
  }

  return reasons;
}

import type { Ping } from "@/types/database";

export interface MetricsResult {
  uptime_24h: number | null;
  uptime_7d: number | null;
  uptime_30d: number | null;
  avg_latency_ms: number | null;
  p95_latency_ms: number | null;
  error_rate: number | null;
}

/**
 * Calculate quality metrics from ping history
 */
export function calculateMetrics(pings: Ping[]): MetricsResult {
  if (pings.length === 0) {
    return {
      uptime_24h: null,
      uptime_7d: null,
      uptime_30d: null,
      avg_latency_ms: null,
      p95_latency_ms: null,
      error_rate: null,
    };
  }

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter pings by time period
  const pings24h = pings.filter((p) => new Date(p.pinged_at) >= oneDayAgo);
  const pings7d = pings.filter((p) => new Date(p.pinged_at) >= sevenDaysAgo);
  const pings30d = pings.filter((p) => new Date(p.pinged_at) >= thirtyDaysAgo);

  // Calculate uptime percentages
  const uptime24h = calculateUptime(pings24h);
  const uptime7d = calculateUptime(pings7d);
  const uptime30d = calculateUptime(pings30d);

  // Calculate latency metrics from successful pings
  const successfulPings = pings.filter((p) => p.success && p.latency_ms !== null);
  const latencies = successfulPings.map((p) => p.latency_ms!);

  const avgLatency = latencies.length > 0 ? average(latencies) : null;
  const p95Latency = latencies.length > 0 ? percentile(latencies, 95) : null;

  // Calculate error rate (over all pings)
  const errorRate =
    pings.length > 0
      ? (pings.filter((p) => !p.success).length / pings.length) * 100
      : null;

  return {
    uptime_24h: uptime24h,
    uptime_7d: uptime7d,
    uptime_30d: uptime30d,
    avg_latency_ms: avgLatency !== null ? Math.round(avgLatency) : null,
    p95_latency_ms: p95Latency !== null ? Math.round(p95Latency) : null,
    error_rate: errorRate !== null ? parseFloat(errorRate.toFixed(4)) : null,
  };
}

function calculateUptime(pings: Ping[]): number | null {
  if (pings.length === 0) return null;
  const successful = pings.filter((p) => p.success).length;
  return parseFloat(((successful / pings.length) * 100).toFixed(2));
}

function average(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

function percentile(numbers: number[], p: number): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Determine if an endpoint should be marked as inactive
 * based on consecutive failures
 */
export function shouldMarkInactive(consecutiveFailures: number): boolean {
  // Mark inactive after 10 consecutive failures (about 50 minutes at 5-min intervals)
  return consecutiveFailures >= 10;
}

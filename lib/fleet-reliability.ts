import type { FleetReliabilityEntry } from "./api-fleet-reliability";

/**
 * This dashboard's display buckets for an uptime ratio (not a backend enum),
 * coloured like `lib/status.ts`.
 */
export type ReliabilityBucket = "healthy" | "degraded" | "critical";

/**
 * `onlineMs`/`totalMs` as a ratio. As in the backend's ranking, an empty
 * window counts as fully online: there is no evidence either way.
 */
export const uptimeRatio = ({
  onlineMs,
  totalMs,
}: {
  onlineMs: number;
  totalMs: number;
}): number => (totalMs === 0 ? 1 : onlineMs / totalMs);

export const reliabilityBucket = (ratio: number): ReliabilityBucket => {
  if (ratio >= 0.95) return "healthy";
  if (ratio >= 0.8) return "degraded";
  return "critical";
};

export type ReliabilityTrend = "up" | "down" | "stable";

/** Below this delta, a ratio change reads as noise rather than a real trend. */
const TREND_EPSILON = 0.01;

/** Compares an entry's current-window ratio against its previous window. */
export const reliabilityTrend = (entry: FleetReliabilityEntry): ReliabilityTrend => {
  const current = uptimeRatio(entry);
  const previous = uptimeRatio({
    onlineMs: entry.previousOnlineMs,
    totalMs: entry.previousTotalMs,
  });
  const delta = current - previous;

  if (delta > TREND_EPSILON) return "up";
  if (delta < -TREND_EPSILON) return "down";
  return "stable";
};

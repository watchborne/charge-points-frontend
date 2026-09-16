import type { FleetReliabilityEntry } from "./api-fleet-reliability";

/**
 * Derived display buckets for a charge point's current-window uptime ratio —
 * not a backend enum, this dashboard's own reading of the ranking so rows can
 * be colored consistently with the rest of the platform's status vocabulary
 * (see `lib/status.ts`).
 */
export type ReliabilityBucket = "healthy" | "degraded" | "critical";

/**
 * `onlineMs`/`totalMs` reduced to a ratio. Mirrors the backend's own
 * `rankFleetReliability` (charge-points-server's
 * `src/application/shared/rank-fleet-reliability.ts`): an empty window
 * (`totalMs === 0`) is treated as fully online, not a problem — there is no
 * evidence either way, so it isn't flagged as the worst case.
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

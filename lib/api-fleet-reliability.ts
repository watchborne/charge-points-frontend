import { withErrorLogging } from "./api-error-wrapper";
import { buildUptimeQuery, type UptimeQuery } from "./api-uptime";
import { httpClient } from "./http-client";

// GET /api/charge-points/reliability: a response-only ranking, declared
// locally. Timestamps are ISO strings.

export type FleetReliabilityEntry = {
  chargePointId: string;
  name: string;
  siteId: string | null;
  onlineMs: number;
  totalMs: number;
  previousOnlineMs: number;
  previousTotalMs: number;
  /** Alerts opened, in the current window only (any type, any connector). */
  incidentCount: number;
  /** Alerts opened in the immediately preceding window, for the trend. */
  previousIncidentCount: number;
};

export type FleetReliability = {
  /** Start of the current window actually reduced, bounds included. */
  from: string;
  /** End of the current window actually reduced, bounds included. */
  to: string;
  /** Start of the immediately preceding window of the same length, for the trend. */
  previousFrom: string;
  /** End of the immediately preceding window — equal to `from`. */
  previousTo: string;
  /** Ranked worst-first; empty for a caller with no visible charge points. */
  chargePoints: FleetReliabilityEntry[];
};

export const fleetReliabilityApis = {
  getFleetReliability: async function (query: UptimeQuery = {}): Promise<FleetReliability> {
    return withErrorLogging(
      () =>
        httpClient.get<FleetReliability>(
          `/api/charge-points/reliability${buildUptimeQuery(query)}`,
        ),
      "FleetReliability.getFleetReliability",
    );
  },
};

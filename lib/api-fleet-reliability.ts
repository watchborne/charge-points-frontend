import { withErrorLogging } from "./api-error-wrapper";
import { buildUptimeQuery, type UptimeQuery } from "./api-uptime";
import { httpClient } from "./http-client";

// The response shape for GET /api/charge-points/reliability. Not part of
// @watchborne/charge-points-types, same reasoning as ChargePointUptime/SiteUptime
// in api-uptime.ts: the backend's ranking (charge-points-server issue #581) is
// response-only, no domain entity backs it — the dashboard codes against this
// response contract. Timestamps arrive as ISO strings and are parsed where
// rendered, never widened to `Date` here.

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

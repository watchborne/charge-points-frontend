import type {
  Connector,
  ConnectorStatus,
  Site,
  SiteHealth,
  SiteHealthStatus,
} from "@watchborne/charge-points-types";

import type { ChargePointWithConnectors } from "@/types/charge-point";

const UNAVAILABLE_CONNECTOR_STATUSES = new Set<ConnectorStatus>(["Faulted", "Unavailable"]);

/**
 * Client-side port of the backend's `computeSiteHealth`, kept in lockstep
 * (same buckets and thresholds); the repos share wire types, not code.
 * Derived from `chargePoints`, which the WebSocket keeps live.
 */
export const deriveSiteHealth = (
  siteId: string,
  chargePoints: ChargePointWithConnectors[],
): SiteHealth => {
  let chargePointsOnline = 0;
  let chargePointsWarning = 0;
  let chargePointsOffline = 0;

  for (const chargePoint of chargePoints) {
    if (chargePoint.connection.status === "OFFLINE") {
      chargePointsOffline += 1;
      continue;
    }

    const hasUnavailableConnector = chargePoint.connectors.some((connector: Connector) =>
      UNAVAILABLE_CONNECTOR_STATUSES.has(connector.status),
    );

    if (chargePoint.connection.status === "WARNING" || hasUnavailableConnector) {
      chargePointsWarning += 1;
    } else {
      chargePointsOnline += 1;
    }
  }

  const chargePointsTotal = chargePoints.length;

  return {
    siteId,
    chargePointsTotal,
    chargePointsOnline,
    chargePointsWarning,
    chargePointsOffline,
    status: deriveStatus(chargePointsTotal, chargePointsWarning, chargePointsOffline),
  };
};

/** `CRITICAL` at 100% offline, `DEGRADED` at >=50% offline+warning, else `HEALTHY`. */
const deriveStatus = (
  chargePointsTotal: number,
  chargePointsWarning: number,
  chargePointsOffline: number,
): SiteHealthStatus => {
  if (chargePointsTotal === 0) return "HEALTHY";
  if (chargePointsOffline === chargePointsTotal) return "CRITICAL";
  if ((chargePointsOffline + chargePointsWarning) / chargePointsTotal >= 0.5) return "DEGRADED";
  return "HEALTHY";
};

/**
 * Health for every site from its own charge points; a site without any is
 * `HEALTHY` with zero counts.
 */
export const deriveSitesHealth = (
  sites: Site[],
  chargePoints: ChargePointWithConnectors[],
): SiteHealth[] => {
  const chargePointsBySiteId = new Map<string, ChargePointWithConnectors[]>();
  for (const chargePoint of chargePoints) {
    if (chargePoint.siteId === null) continue;
    const existing = chargePointsBySiteId.get(chargePoint.siteId);
    if (existing) existing.push(chargePoint);
    else chargePointsBySiteId.set(chargePoint.siteId, [chargePoint]);
  }

  return sites.map((site) => deriveSiteHealth(site.id, chargePointsBySiteId.get(site.id) ?? []));
};

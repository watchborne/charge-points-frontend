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
 * Client-side port of `charge-points-server`'s `computeSiteHealth`
 * (`src/application/shared/compute-site-health.ts`) — kept in exact lockstep
 * with it: same buckets, same thresholds. See that file for the full
 * rationale; duplicated here rather than shared across repos because the two
 * projects don't share application code, only the wire types.
 *
 * `charge-points-server#503` (P4, item 2): the dashboard used to fetch this
 * from a second endpoint, `GET /api/sites/health`, redoing the same
 * sites -> charge points -> connectors read `GET /api/sites` had just made
 * for the same caller moments earlier. Deriving it here from `chargePoints`
 * — already fetched for the dashboard's other panels, and kept live over the
 * dashboard WebSocket by `useChargePoints` — removes that network round trip
 * entirely rather than just reordering it.
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
 * Health for every given site, each derived from its own charge points only
 * — a site with none of its own is `HEALTHY` with every count at 0, matching
 * `computeSiteHealth`'s own empty-site case.
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

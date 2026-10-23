import { ChargePointWithConnectors } from "@/types/charge-point";

/**
 * Whether a charge point is still in the commissioning backlog: no site
 * **and** still named after its raw OCPP identity, as auto-discovery or a
 * token claim leaves it. Not `commissionedAt === null`: a token claim sets
 * `commissionedAt` on arrival, before the station has a name or a site.
 * Fixing either field alone takes it out of the queue.
 */
export const isAwaitingCommissioning = (chargePoint: ChargePointWithConnectors): boolean =>
  chargePoint.siteId === null && chargePoint.name === chargePoint.ocppIdentity;

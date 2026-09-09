import { ChargePointWithConnectors } from "@/types/charge-point";

/**
 * Whether a charge point is still sitting in the commissioning backlog.
 *
 * Not `commissionedAt === null`: charge-points-server's commissioning-token
 * self-claim (the flow the Configuration page's `CommissioningTokenPanel`
 * drives) now records the `CommissioningAttempt` — and so sets
 * `commissionedAt` — the moment a station claims itself over OCPP, before it
 * has a name or a site. Gating the queue on `commissionedAt` alone means a
 * token-claimed station is "commissioned" on arrival and never surfaces here,
 * silently joining the fleet under its raw `ocppIdentity` with no site and no
 * further prompt to finish setup.
 *
 * Instead, a charge point is awaiting commissioning while it still looks
 * exactly as auto-discovery/auto-claim left it: no site **and** still named
 * after its raw OCPP identity. Both conditions are required (not `||`) so a
 * charge point deliberately left without a site, or deliberately left under
 * its raw identity, still leaves the queue the moment the other half is
 * addressed — the bug `commissionedAt` was introduced to fix (issue #279)
 * still doesn't reappear for either field alone.
 */
export const isAwaitingCommissioning = (chargePoint: ChargePointWithConnectors): boolean =>
  chargePoint.siteId === null && chargePoint.name === chargePoint.ocppIdentity;

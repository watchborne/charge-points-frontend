import { ChargePointWithConnectors } from "@/types/charge-point";

/**
 * Whether a charge point is still sitting in the commissioning backlog:
 * tracked explicitly via `commissionedAt` rather than inferred from
 * `siteId === null`, which conflated "never commissioned" with "deliberately
 * commissioned without a site" (a charge point commissioned without one, via
 * `CommissioningDialog`, would otherwise never leave the queue — issue #279).
 */
export const isAwaitingCommissioning = (chargePoint: ChargePointWithConnectors): boolean =>
  chargePoint.commissionedAt === null;

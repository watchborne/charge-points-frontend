export {
  type ChargePointConnectionStatus,
  type ChargePointMeta,
  type ChargePoint,
  type Connector,
  type ConnectorStatus,
  isExpectedConnectorTransition,
} from "@watchborne/charge-points-types";

import type {
  ChargePointWithConnectors as PackageChargePointWithConnectors,
  ChargePointWithSite as PackageChargePointWithSite,
} from "@watchborne/charge-points-types";

/**
 * `commissionedAt` (`Membership.commissionedAt` on the backend) is
 * server-local queue/audit state, not part of the shared
 * `@watchborne/charge-points-types` `ChargePoint` shape — added here rather
 * than in the package, the same way `charge-points-server` extends its
 * response schemas locally (issue charge-points-frontend#279 /
 * charge-points-server#423). `null` while a charge point is still sitting in
 * the commissioning queue.
 */
export type ChargePointWithConnectors = PackageChargePointWithConnectors & {
  commissionedAt: string | null;
};

export type ChargePointWithSite = PackageChargePointWithSite & {
  commissionedAt: string | null;
};

/**
 * `POST /api/charge-points`'s response shape only (ADR 0010, charge-points-server):
 * the created charge point plus the ready-to-paste OCPP connection URL to
 * configure on the physical device. Not part of the persisted `ChargePoint`
 * shape — every later read rebuilds it from `ocppIdentity` instead, so it is
 * never returned again after creation.
 */
export type CreatedChargePoint = ChargePointWithConnectors & {
  connectionUrl: string;
};

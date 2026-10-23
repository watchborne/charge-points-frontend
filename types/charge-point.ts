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
 * Adds the server-local `commissionedAt` (`Membership.commissionedAt`) to the
 * shared shape; `null` while in the commissioning queue.
 */
export type ChargePointWithConnectors = PackageChargePointWithConnectors & {
  commissionedAt: string | null;
};

export type ChargePointWithSite = PackageChargePointWithSite & {
  commissionedAt: string | null;
};

/**
 * `POST /api/charge-points`'s response: the created charge point plus its OCPP
 * connection URL, which later reads don't return.
 */
export type CreatedChargePoint = ChargePointWithConnectors & {
  connectionUrl: string;
};

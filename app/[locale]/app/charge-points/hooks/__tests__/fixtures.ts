import { ChargePointWithConnectors } from "../../../../../../types/charge-point";

export const chargePoint = (
  id: string,
  overrides: Partial<ChargePointWithConnectors> = {},
): ChargePointWithConnectors =>
  ({
    id,
    name: `CP-${id}`,
    ocppIdentity: `ocpp-${id}`,
    siteId: "site-1",
    isActive: true,
    connection: { status: "SYNCED", lastSeenAt: new Date() },
    ocppVersion: "1.6",
    meta: {},
    connectors: [],
    ...overrides,
  }) as ChargePointWithConnectors;

import { faker } from "@faker-js/faker";
import type { ChargePointWithConnectors } from "@watchborne/charge-points-types";

export const createChargePoint = (
  overrides: Partial<ChargePointWithConnectors> = {},
): ChargePointWithConnectors => ({
  id: faker.string.uuid(),
  name: `Borne ${faker.location.city()}`,
  isActive: faker.datatype.boolean(),
  siteId: faker.string.uuid(),
  connection: {
    status: faker.helpers.arrayElement(["CONNECTED", "SYNCED", "OFFLINE"]),
    lastSeenAt: faker.date.recent(),
  },
  ocppVersion: "1.6",
  connectors: [],
  meta: {},
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  deletedAt: null,
  ...overrides,
});

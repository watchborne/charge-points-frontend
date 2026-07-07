import { faker } from "@faker-js/faker";
import type { ChargePoint } from "@watchborne/charge-points-types";

export const createChargePoint = (overrides: Partial<ChargePoint> = {}): ChargePoint => ({
  id: faker.string.uuid(),
  name: `Borne ${faker.location.city()}`,
  isActive: faker.datatype.boolean(),
  siteId: faker.string.uuid(),
  connection: {
    status: faker.helpers.arrayElement(["CONNECTED", "SYNCED", "OFFLINE"]),
    lastSeenAt: faker.date.recent(),
  },
  status: faker.helpers.arrayElement(["Available", "Charging", "Unavailable", "Faulted"]),
  meta: {},
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  deletedAt: null,
  ...overrides,
});

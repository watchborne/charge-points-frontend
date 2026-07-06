import { faker } from "@faker-js/faker";
import type { Site } from "@watchborne/charge-points-types";

export const createSite = (overrides: Partial<Site> = {}): Site => ({
  id: faker.string.uuid(),
  name: `Site ${faker.location.city()}`,
  customer: faker.string.uuid(),
  installDate: faker.date.past(),
  lastVisit: faker.date.recent(),
  ...overrides,
});

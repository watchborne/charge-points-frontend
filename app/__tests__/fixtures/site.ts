import { faker } from "@faker-js/faker";
import type { Site } from "@watchborne/charge-points-types";

export const createSite = (overrides: Partial<Site> = {}): Site => ({
  id: faker.string.uuid(),
  name: `Site ${faker.location.city()}`,
  customer: faker.company.name(),
  customerId: faker.string.uuid(),
  installedAt: faker.date.past(),
  lastVisitedAt: faker.date.recent(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  deletedAt: null,
  ...overrides,
});

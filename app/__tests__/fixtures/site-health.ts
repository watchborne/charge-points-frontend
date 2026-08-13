import { faker } from "@faker-js/faker";
import type { SiteHealth } from "@watchborne/charge-points-types";

export const createSiteHealth = (overrides: Partial<SiteHealth> = {}): SiteHealth => ({
  siteId: faker.string.uuid(),
  chargePointsTotal: 4,
  chargePointsOnline: 4,
  chargePointsWarning: 0,
  chargePointsOffline: 0,
  status: "HEALTHY",
  ...overrides,
});

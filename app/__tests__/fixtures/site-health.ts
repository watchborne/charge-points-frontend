import { faker } from "@faker-js/faker";
import type { SiteHealth } from "@watchborne/charge-points-types";

export const createSiteHealth = (overrides: Partial<SiteHealth> = {}): SiteHealth => ({
  siteId: faker.string.uuid(),
  chargePointsTotal: 4,
  chargePointsOffline: 0,
  offlineRatio: 0,
  status: "HEALTHY",
  ...overrides,
});

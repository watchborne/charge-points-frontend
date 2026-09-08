import type { Site } from "@watchborne/charge-points-types";
import { describe, expect, it } from "vitest";

import { isSiteVisitOverdue, OVERDUE_VISIT_AFTER_DAYS } from "../derive-site-visit-overdue";

const NOW = new Date("2026-09-06T00:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;

const buildSite = (overrides: Partial<Site> = {}): Site =>
  ({
    id: "site-1",
    name: "Paris Nord",
    customer: "LVMH",
    customerId: "c-1",
    installedAt: new Date("2020-01-01T00:00:00.000Z"),
    lastVisitedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as Site;

describe("isSiteVisitOverdue", () => {
  it("SHOULD return false WHEN the site was visited within the window", () => {
    const site = buildSite({ lastVisitedAt: new Date(NOW.getTime() - DAY_MS) });

    expect(isSiteVisitOverdue(site, NOW)).toBe(false);
  });

  it("SHOULD return true WHEN the last visit is older than the window", () => {
    const site = buildSite({
      lastVisitedAt: new Date(NOW.getTime() - (OVERDUE_VISIT_AFTER_DAYS + 1) * DAY_MS),
    });

    expect(isSiteVisitOverdue(site, NOW)).toBe(true);
  });

  it("SHOULD return false exactly at the threshold — strictly greater than is overdue", () => {
    const site = buildSite({
      lastVisitedAt: new Date(NOW.getTime() - OVERDUE_VISIT_AFTER_DAYS * DAY_MS),
    });

    expect(isSiteVisitOverdue(site, NOW)).toBe(false);
  });

  it("SHOULD fall back to installedAt WHEN the site has never been visited", () => {
    const overdueSite = buildSite({
      lastVisitedAt: null,
      installedAt: new Date(NOW.getTime() - (OVERDUE_VISIT_AFTER_DAYS + 1) * DAY_MS),
    });
    const newSite = buildSite({
      lastVisitedAt: null,
      installedAt: new Date(NOW.getTime() - DAY_MS),
    });

    expect(isSiteVisitOverdue(overdueSite, NOW)).toBe(true);
    expect(isSiteVisitOverdue(newSite, NOW)).toBe(false);
  });
});

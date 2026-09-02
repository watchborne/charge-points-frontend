import type { Site } from "@watchborne/charge-points-types";
import { describe, expect, it } from "vitest";

import type { ChargePointWithConnectors } from "@/types/charge-point";

import { deriveSiteHealth, deriveSitesHealth } from "../derive-site-health";

const SITE = "11111111-1111-4111-8111-111111111111";

const chargePoint = (
  id: string,
  status: "OFFLINE" | "CONNECTED" | "SYNCED" | "WARNING",
  overrides: Partial<ChargePointWithConnectors> = {},
): ChargePointWithConnectors =>
  ({
    id,
    connection: { status },
    connectors: [],
    ...overrides,
  }) as ChargePointWithConnectors;

const connector = (id: string, status: string) => ({ connectorId: id, status }) as never;

// Ported from charge-points-server's compute-site-health.test.ts — this file
// is a direct port of that logic (see derive-site-health.ts), so it should
// pass the same cases.
describe("deriveSiteHealth", () => {
  it("SHOULD return HEALTHY with every count at 0 WHEN the site has no charge points", () => {
    const health = deriveSiteHealth(SITE, []);

    expect(health).toEqual({
      siteId: SITE,
      chargePointsTotal: 0,
      chargePointsOnline: 0,
      chargePointsWarning: 0,
      chargePointsOffline: 0,
      status: "HEALTHY",
    });
  });

  it("SHOULD count a SYNCED/CONNECTED charge point with no flagged connector as online", () => {
    const health = deriveSiteHealth(SITE, [
      chargePoint("a", "SYNCED"),
      chargePoint("b", "CONNECTED"),
    ]);

    expect(health.chargePointsOnline).toBe(2);
    expect(health.chargePointsWarning).toBe(0);
    expect(health.chargePointsOffline).toBe(0);
    expect(health.status).toBe("HEALTHY");
  });

  it("SHOULD count an OFFLINE charge point as offline, regardless of its connectors", () => {
    const health = deriveSiteHealth(SITE, [
      chargePoint("a", "OFFLINE", { connectors: [connector("c1", "Faulted")] }),
    ]);

    expect(health.chargePointsOffline).toBe(1);
    expect(health.chargePointsWarning).toBe(0);
  });

  it("SHOULD count a charge point with a missed heartbeat (WARNING) as warning", () => {
    const health = deriveSiteHealth(SITE, [chargePoint("a", "WARNING")]);

    expect(health.chargePointsWarning).toBe(1);
    expect(health.chargePointsOnline).toBe(0);
  });

  it("SHOULD count an online charge point with a Faulted connector as warning", () => {
    const health = deriveSiteHealth(SITE, [
      chargePoint("a", "SYNCED", { connectors: [connector("c1", "Faulted")] }),
    ]);

    expect(health.chargePointsWarning).toBe(1);
    expect(health.chargePointsOnline).toBe(0);
  });

  it("SHOULD count an online charge point with an Unavailable connector as warning", () => {
    const health = deriveSiteHealth(SITE, [
      chargePoint("a", "CONNECTED", { connectors: [connector("c1", "Unavailable")] }),
    ]);

    expect(health.chargePointsWarning).toBe(1);
  });

  it("SHOULD NOT count a Reserved or Charging connector as a warning reason", () => {
    const health = deriveSiteHealth(SITE, [
      chargePoint("a", "SYNCED", {
        connectors: [connector("c1", "Reserved"), connector("c2", "Charging")],
      }),
    ]);

    expect(health.chargePointsOnline).toBe(1);
    expect(health.chargePointsWarning).toBe(0);
  });

  it("SHOULD return HEALTHY WHEN fewer than half the charge points are offline or warning", () => {
    const health = deriveSiteHealth(SITE, [
      chargePoint("a", "OFFLINE"),
      chargePoint("b", "SYNCED"),
      chargePoint("c", "SYNCED"),
    ]);

    expect(health.status).toBe("HEALTHY");
  });

  it("SHOULD return DEGRADED WHEN offline + warning together reach exactly half", () => {
    const health = deriveSiteHealth(SITE, [
      chargePoint("a", "OFFLINE"),
      chargePoint("b", "WARNING"),
      chargePoint("c", "SYNCED"),
      chargePoint("d", "SYNCED"),
    ]);

    expect(health.status).toBe("DEGRADED");
  });

  it("SHOULD return CRITICAL WHEN every charge point is offline", () => {
    const health = deriveSiteHealth(SITE, [
      chargePoint("a", "OFFLINE"),
      chargePoint("b", "OFFLINE"),
    ]);

    expect(health.status).toBe("CRITICAL");
  });

  it("SHOULD NOT return CRITICAL WHEN every charge point is in warning but none offline", () => {
    // CRITICAL is reserved for 100% offline: warning alone, however
    // widespread, never reaches it.
    const health = deriveSiteHealth(SITE, [
      chargePoint("a", "WARNING"),
      chargePoint("b", "WARNING"),
    ]);

    expect(health.status).toBe("DEGRADED");
  });
});

describe("deriveSitesHealth", () => {
  const site = (id: string): Site => ({ id }) as Site;

  it("SHOULD scope each site's health to its own charge points only", () => {
    const siteA = "site-a";
    const siteB = "site-b";
    const chargePoints = [
      chargePoint("a1", "SYNCED", { siteId: siteA } as never),
      chargePoint("a2", "OFFLINE", { siteId: siteA } as never),
      chargePoint("b1", "SYNCED", { siteId: siteB } as never),
    ];

    const result = deriveSitesHealth([site(siteA), site(siteB)], chargePoints);

    expect(result).toEqual([
      {
        siteId: siteA,
        chargePointsTotal: 2,
        chargePointsOnline: 1,
        chargePointsWarning: 0,
        chargePointsOffline: 1,
        status: "DEGRADED",
      },
      {
        siteId: siteB,
        chargePointsTotal: 1,
        chargePointsOnline: 1,
        chargePointsWarning: 0,
        chargePointsOffline: 0,
        status: "HEALTHY",
      },
    ]);
  });

  it("SHOULD ignore a charge point with no site", () => {
    const siteA = "site-a";
    const chargePoints = [
      chargePoint("a1", "SYNCED", { siteId: siteA } as never),
      chargePoint("unassigned", "OFFLINE", { siteId: null } as never),
    ];

    const result = deriveSitesHealth([site(siteA)], chargePoints);

    expect(result).toEqual([
      {
        siteId: siteA,
        chargePointsTotal: 1,
        chargePointsOnline: 1,
        chargePointsWarning: 0,
        chargePointsOffline: 0,
        status: "HEALTHY",
      },
    ]);
  });

  it("SHOULD return HEALTHY for a site with no charge points at all", () => {
    const result = deriveSitesHealth([site("empty-site")], []);

    expect(result).toEqual([
      {
        siteId: "empty-site",
        chargePointsTotal: 0,
        chargePointsOnline: 0,
        chargePointsWarning: 0,
        chargePointsOffline: 0,
        status: "HEALTHY",
      },
    ]);
  });
});

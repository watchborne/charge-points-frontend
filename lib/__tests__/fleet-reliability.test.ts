import { describe, expect, it } from "vitest";

import type { FleetReliabilityEntry } from "../api-fleet-reliability";
import { reliabilityBucket, reliabilityTrend, uptimeRatio } from "../fleet-reliability";

const entry = (overrides: Partial<FleetReliabilityEntry> = {}): FleetReliabilityEntry => ({
  chargePointId: "cp-1",
  name: "CP-1",
  siteId: null,
  onlineMs: 1000,
  totalMs: 1000,
  previousOnlineMs: 1000,
  previousTotalMs: 1000,
  incidentCount: 0,
  previousIncidentCount: 0,
  ...overrides,
});

describe("uptimeRatio", () => {
  it("SHOULD divide onlineMs by totalMs", () => {
    expect(uptimeRatio({ onlineMs: 500, totalMs: 1000 })).toBe(0.5);
  });

  it("SHOULD treat a zero-length window as fully online, not a problem", () => {
    expect(uptimeRatio({ onlineMs: 0, totalMs: 0 })).toBe(1);
  });
});

describe("reliabilityBucket", () => {
  it("SHOULD be healthy WHEN the ratio is 0.95 or above", () => {
    expect(reliabilityBucket(1)).toBe("healthy");
    expect(reliabilityBucket(0.95)).toBe("healthy");
  });

  it("SHOULD be degraded WHEN the ratio is between 0.8 and 0.95", () => {
    expect(reliabilityBucket(0.94)).toBe("degraded");
    expect(reliabilityBucket(0.8)).toBe("degraded");
  });

  it("SHOULD be critical WHEN the ratio is below 0.8", () => {
    expect(reliabilityBucket(0.79)).toBe("critical");
    expect(reliabilityBucket(0)).toBe("critical");
  });
});

describe("reliabilityTrend", () => {
  it("SHOULD be up WHEN the current window is meaningfully better than the previous one", () => {
    const trend = reliabilityTrend(
      entry({ onlineMs: 1000, totalMs: 1000, previousOnlineMs: 500, previousTotalMs: 1000 }),
    );
    expect(trend).toBe("up");
  });

  it("SHOULD be down WHEN the current window is meaningfully worse than the previous one", () => {
    const trend = reliabilityTrend(
      entry({ onlineMs: 500, totalMs: 1000, previousOnlineMs: 1000, previousTotalMs: 1000 }),
    );
    expect(trend).toBe("down");
  });

  it("SHOULD be stable WHEN the two windows are within the noise threshold", () => {
    const trend = reliabilityTrend(
      entry({ onlineMs: 995, totalMs: 1000, previousOnlineMs: 1000, previousTotalMs: 1000 }),
    );
    expect(trend).toBe("stable");
  });
});

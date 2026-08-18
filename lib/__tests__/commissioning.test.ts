import { describe, expect, it } from "vitest";

import type { ChargePointWithConnectors } from "@/types/charge-point";

import { isAwaitingCommissioning } from "../commissioning";

const chargePoint = (overrides: Partial<ChargePointWithConnectors>): ChargePointWithConnectors =>
  ({
    id: "cp-1",
    name: "CP-1",
    siteId: null,
    commissionedAt: null,
    connectors: [],
    ...overrides,
  }) as ChargePointWithConnectors;

describe("isAwaitingCommissioning", () => {
  it("SHOULD report true WHEN commissionedAt is null", () => {
    expect(isAwaitingCommissioning(chargePoint({ commissionedAt: null }))).toBe(true);
  });

  it("SHOULD report false WHEN commissionedAt is set, even with no site (issue #279)", () => {
    // A charge point deliberately commissioned without a site must leave the
    // queue — the bug this field exists to fix.
    expect(
      isAwaitingCommissioning(
        chargePoint({ commissionedAt: "2026-01-01T00:00:00.000Z", siteId: null }),
      ),
    ).toBe(false);
  });

  it("SHOULD report false WHEN commissionedAt is set and a site is attached", () => {
    expect(
      isAwaitingCommissioning(
        chargePoint({ commissionedAt: "2026-01-01T00:00:00.000Z", siteId: "site-1" }),
      ),
    ).toBe(false);
  });
});

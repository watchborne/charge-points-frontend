import { describe, expect, it } from "vitest";

import type { ChargePointWithConnectors } from "@/types/charge-point";

import { isAwaitingCommissioning } from "../commissioning";

const chargePoint = (overrides: Partial<ChargePointWithConnectors>): ChargePointWithConnectors =>
  ({
    id: "cp-1",
    ocppIdentity: "cp-1-raw-id",
    name: "cp-1-raw-id",
    siteId: null,
    commissionedAt: null,
    connectors: [],
    ...overrides,
  }) as ChargePointWithConnectors;

describe("isAwaitingCommissioning", () => {
  it("SHOULD report true WHEN never renamed and no site, regardless of commissionedAt", () => {
    // A commissioning-token self-claim (charge-points-server's
    // ClaimChargePointWithTokenCommandHandler) sets commissionedAt the moment
    // the station claims itself over OCPP — before it has a name or a site —
    // so a claimed-but-untouched station must still surface here.
    expect(
      isAwaitingCommissioning(chargePoint({ commissionedAt: "2026-01-01T00:00:00.000Z" })),
    ).toBe(true);
  });

  it("SHOULD report false WHEN renamed, even with no site", () => {
    // A charge point deliberately commissioned without a site must leave the
    // queue once it's been renamed — the bug issue #279 fixed.
    expect(
      isAwaitingCommissioning(chargePoint({ name: "Borne parking sous-sol", siteId: null })),
    ).toBe(false);
  });

  it("SHOULD report false WHEN a site is attached, even under the raw ocppIdentity", () => {
    expect(isAwaitingCommissioning(chargePoint({ siteId: "site-1" }))).toBe(false);
  });

  it("SHOULD report false WHEN renamed and a site is attached", () => {
    expect(
      isAwaitingCommissioning(chargePoint({ name: "Borne parking sous-sol", siteId: "site-1" })),
    ).toBe(false);
  });
});

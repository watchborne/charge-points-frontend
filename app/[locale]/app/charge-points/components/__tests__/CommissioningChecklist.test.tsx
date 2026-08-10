import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChargePointConnectionStatus, ChargePointWithConnectors } from "@/types/charge-point";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "appPage.chargePoints.commissioning.selfTest.title": "Commissioning check",
      "appPage.chargePoints.commissioning.selfTest.online": "Station connected",
      "appPage.chargePoints.commissioning.selfTest.connectors": "Connectors report their status",
    };
    return map[key] ?? key;
  },
}));

import { CommissioningChecklist } from "../CommissioningChecklist";

const makeChargePoint = (
  status: ChargePointConnectionStatus,
  connectorCount: number,
): ChargePointWithConnectors =>
  ({
    id: "11111111-1111-4111-8111-111111111111",
    name: "CP-001",
    siteId: null,
    isActive: true,
    connection: { status, lastSeenAt: null },
    ocppVersion: "1.6",
    meta: {},
    connectors: Array.from({ length: connectorCount }, (_, i) => ({
      id: `c${i}`,
      chargePointId: "11111111-1111-4111-8111-111111111111",
      connectorId: i + 1,
      status: "Available",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }) as ChargePointWithConnectors;

// A check row passes when its status icon carries the "available" success tone.
const rowPassed = (label: string): boolean => {
  const icon = screen.getByText(label).parentElement?.querySelector("svg");
  return icon?.classList.contains("text-status-available-foreground") ?? false;
};

afterEach(() => cleanup());

describe("CommissioningChecklist", () => {
  it("SHOULD pass both checks WHEN the station is connected and reports a connector", () => {
    render(<CommissioningChecklist chargePoint={makeChargePoint("CONNECTED", 1)} />);

    expect(rowPassed("Station connected")).toBe(true);
    expect(rowPassed("Connectors report their status")).toBe(true);
  });

  it("SHOULD fail the connector check WHEN no connector has reported yet", () => {
    render(<CommissioningChecklist chargePoint={makeChargePoint("SYNCED", 0)} />);

    expect(rowPassed("Station connected")).toBe(true);
    expect(rowPassed("Connectors report their status")).toBe(false);
  });

  it("SHOULD fail the online check WHEN the station is offline", () => {
    render(<CommissioningChecklist chargePoint={makeChargePoint("OFFLINE", 2)} />);

    expect(rowPassed("Station connected")).toBe(false);
    expect(rowPassed("Connectors report their status")).toBe(true);
  });
});

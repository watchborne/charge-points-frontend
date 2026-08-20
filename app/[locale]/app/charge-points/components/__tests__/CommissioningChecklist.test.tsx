import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChargePointConnectionStatus, ChargePointWithConnectors } from "@/types/charge-point";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "appPage.chargePoints.commissioning.selfTest.title": "Commissioning check",
      "appPage.chargePoints.commissioning.selfTest.site": "Assigned to a site",
      "appPage.chargePoints.commissioning.selfTest.online": "Station connected",
      "appPage.chargePoints.commissioning.selfTest.bootAccepted": "Boot accepted by the station",
      "appPage.chargePoints.commissioning.selfTest.ocppVersionKnown": "OCPP version confirmed",
      "appPage.chargePoints.commissioning.selfTest.connectors": "Connectors report their status",
    };
    return map[key] ?? key;
  },
}));

import { CommissioningChecklist } from "../CommissioningChecklist";

const makeChargePoint = (
  overrides: {
    status?: ChargePointConnectionStatus;
    connectorCount?: number;
    siteId?: string | null;
    lastSeenAt?: Date | null;
  } = {},
): ChargePointWithConnectors =>
  ({
    id: "11111111-1111-4111-8111-111111111111",
    name: "CP-001",
    siteId: overrides.siteId ?? null,
    isActive: true,
    connection: {
      status: overrides.status ?? "CONNECTED",
      lastSeenAt: overrides.lastSeenAt ?? null,
    },
    ocppVersion: "1.6",
    meta: {},
    connectors: Array.from({ length: overrides.connectorCount ?? 1 }, (_, i) => ({
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
  it("SHOULD pass every check WHEN the station is assigned, synced and reports a connector", () => {
    render(
      <CommissioningChecklist
        chargePoint={makeChargePoint({
          status: "SYNCED",
          connectorCount: 1,
          siteId: "22222222-2222-4222-8222-222222222222",
          lastSeenAt: new Date(),
        })}
      />,
    );

    expect(rowPassed("Assigned to a site")).toBe(true);
    expect(rowPassed("Station connected")).toBe(true);
    expect(rowPassed("Boot accepted by the station")).toBe(true);
    expect(rowPassed("OCPP version confirmed")).toBe(true);
    expect(rowPassed("Connectors report their status")).toBe(true);
  });

  it("SHOULD fail the connector check WHEN no connector has reported yet", () => {
    render(
      <CommissioningChecklist
        chargePoint={makeChargePoint({ status: "SYNCED", connectorCount: 0 })}
      />,
    );

    expect(rowPassed("Station connected")).toBe(true);
    expect(rowPassed("Connectors report their status")).toBe(false);
  });

  it("SHOULD fail the online and boot-accepted checks WHEN the station is offline", () => {
    render(
      <CommissioningChecklist
        chargePoint={makeChargePoint({ status: "OFFLINE", connectorCount: 2 })}
      />,
    );

    expect(rowPassed("Station connected")).toBe(false);
    expect(rowPassed("Boot accepted by the station")).toBe(false);
    expect(rowPassed("Connectors report their status")).toBe(true);
  });

  it("SHOULD fail the site check WHEN the charge point has no siteId", () => {
    render(<CommissioningChecklist chargePoint={makeChargePoint({ siteId: null })} />);

    expect(rowPassed("Assigned to a site")).toBe(false);
  });

  it("SHOULD fail the boot-accepted check WHEN the station is only CONNECTED, not SYNCED", () => {
    render(<CommissioningChecklist chargePoint={makeChargePoint({ status: "CONNECTED" })} />);

    expect(rowPassed("Station connected")).toBe(true);
    expect(rowPassed("Boot accepted by the station")).toBe(false);
  });

  it("SHOULD fail the OCPP-version-known check WHEN the station has never connected", () => {
    render(
      <CommissioningChecklist
        chargePoint={makeChargePoint({ status: "OFFLINE", lastSeenAt: null })}
      />,
    );

    expect(rowPassed("OCPP version confirmed")).toBe(false);
  });

  it("SHOULD pass the OCPP-version-known check WHEN the station has connected before, even if now offline", () => {
    render(
      <CommissioningChecklist
        chargePoint={makeChargePoint({ status: "OFFLINE", lastSeenAt: new Date("2026-01-01") })}
      />,
    );

    expect(rowPassed("Station connected")).toBe(false);
    expect(rowPassed("OCPP version confirmed")).toBe(true);
  });
});

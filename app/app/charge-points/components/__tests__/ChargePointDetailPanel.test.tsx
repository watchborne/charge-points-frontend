import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      "appPage.chargePoints.detail.connector": `Connector #${values?.connectorId}`,
      "appPage.chargePoints.detail.lastMeterValue": "Last meter reading",
      "appPage.chargePoints.detail.lastSeen": "Last seen",
      "appPage.chargePoints.detail.never": "Never",
      "appPage.chargePoints.detail.site": "Site",
      "appPage.chargePoints.detail.unknownSite": "Unknown site",
      "appPage.chargePoints.availability.button": "Change availability",
      "appPage.chargePoints.unlockConnector.button": "Unlock connector",
    };
    return map[key] ?? key;
  },
}));

import { ChargePointDetailPanel } from "../ChargePointDetailPanel";

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => cleanup());

const CHARGE_POINT = {
  id: "cp-1",
  name: "CP-001",
  siteId: null,
  isActive: true,
  ocppVersion: "1.6",
  meta: {},
  connection: { status: "SYNCED", lastSeenAt: null },
  connectors: [
    {
      id: "connector-1",
      chargePointId: "cp-1",
      connectorId: 1,
      status: "Available",
      lastMeterValue: {
        timestamp: new Date("2024-01-01T00:00:00Z"),
        sampledValue: [{ value: "1000", measurand: "Energy.Active.Import.Register", unit: "Wh" }],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ],
} as never;

describe("ChargePointDetailPanel", () => {
  it("SHOULD display the connector's lastMeterValue snapshot WHEN one is present", () => {
    render(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onToggleActive={vi.fn()}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
        onResetClicked={vi.fn()}
        onChangeAvailability={vi.fn()}
        onUnlockConnector={vi.fn()}
      />,
    );

    expect(screen.getByText("1000 Wh")).toBeTruthy();
  });

  it("SHOULD render no meter value line WHEN the connector never reported one", () => {
    const chargePointWithoutMeterValue = {
      ...CHARGE_POINT,
      connectors: [{ ...CHARGE_POINT.connectors[0], lastMeterValue: undefined }],
    } as never;

    render(
      <ChargePointDetailPanel
        chargePoint={chargePointWithoutMeterValue}
        site={undefined}
        onToggleActive={vi.fn()}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
        onResetClicked={vi.fn()}
        onChangeAvailability={vi.fn()}
        onUnlockConnector={vi.fn()}
      />,
    );

    expect(screen.queryByTitle("Last meter reading")).toBeNull();
  });
});

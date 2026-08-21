import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// The detail panel now nests ChargePointConsumptionPanel, StatusHistoryPanel,
// AlertsPanel and SecurityEventsPanel which fetch on mount and format numbers
// per locale. All are stubbed here so this file stays about the detail panel:
// each nested panel has its own tests.
vi.mock("../../../../../../lib/api", () => ({
  api: {
    Metering: {
      getConsumption: vi.fn().mockResolvedValue({
        chargePointId: "cp-1",
        from: new Date().toISOString(),
        to: new Date().toISOString(),
        series: [],
      }),
      getMeterSamples: vi.fn().mockResolvedValue([]),
    },
    ChargePoints: {
      getAlerts: vi.fn().mockResolvedValue([]),
    },
    StatusHistory: {
      getConnectionEvents: vi.fn().mockResolvedValue([]),
      getConnectorStatusEvents: vi.fn().mockResolvedValue([]),
    },
    SecurityEvents: {
      list: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock("next-intl", () => ({
  useLocale: () => "fr",
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
      "appPage.chargePoints.statusHistory.title": "Status history",
      "appPage.chargePoints.statusHistory.connectivity": "Connectivity",
      "appPage.chargePoints.statusHistory.connectorStatus": `Connector ${values?.connectorId} status`,
      "appPage.chargePoints.statusHistory.connectorLabel": "Connector",
      "appPage.chargePoints.statusHistory.noData": "No data",
      "appPage.chargePoints.statusHistory.truncated": "Truncated",
      "appPage.chargePoints.statusHistory.error": "Failed to load status history.",
      "appPage.chargePoints.statusHistory.ranges.day": "Today",
      "appPage.chargePoints.statusHistory.ranges.7d": "7d",
      "appPage.chargePoints.statusHistory.ranges.30d": "30d",
      "appPage.chargePoints.statusHistory.table.timestamp": "Timestamp",
      "appPage.chargePoints.statusHistory.table.status": "Status",
      "appPage.chargePoints.statusHistory.table.duration": "Duration",
      "appPage.chargePoints.consumption.connectorSeries": `Connector ${values?.connectorId}`,
    };
    return map[key] ?? key;
  },
}));

// Stubbed out: it fetches its own firmware state and subscribes to the dashboard
// WebSocket context, neither of which this suite is about. Its own behaviour is
// covered by FirmwarePanel.test.tsx.
vi.mock("../FirmwarePanel", () => ({
  FirmwarePanel: () => null,
}));

// Stubbed out for the same reason as FirmwarePanel above: it fetches its own
// log-upload state. Its own behaviour is covered by LogUploadPanel.test.tsx.
vi.mock("../LogUploadPanel", () => ({
  LogUploadPanel: () => null,
}));

import { ChargePointDetailPanel } from "../ChargePointDetailPanel";

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => cleanup());

const CONNECTOR = {
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
} as Record<string, unknown>;

const CHARGE_POINT = {
  id: "cp-1",
  name: "CP-001",
  siteId: null,
  isActive: true,
  realtimeAlertsEnabled: false,
  ocppVersion: "1.6",
  meta: {},
  connection: { status: "SYNCED", lastSeenAt: null },
  connectors: [CONNECTOR],
} as Record<string, unknown>;

describe("ChargePointDetailPanel", () => {
  it("SHOULD display the connector's lastMeterValue snapshot WHEN one is present", () => {
    render(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onToggleActive={vi.fn()}
        onToggleRealtimeAlerts={vi.fn()}
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
      connectors: [{ ...CONNECTOR, lastMeterValue: undefined }],
    } as unknown;

    render(
      <ChargePointDetailPanel
        chargePoint={chargePointWithoutMeterValue}
        site={undefined}
        onToggleActive={vi.fn()}
        onToggleRealtimeAlerts={vi.fn()}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
        onResetClicked={vi.fn()}
        onChangeAvailability={vi.fn()}
        onUnlockConnector={vi.fn()}
      />,
    );

    expect(screen.queryByTitle("Last meter reading")).toBeNull();
  });

  it("SHOULD forward the charge point to onToggleRealtimeAlerts WHEN its switch is toggled", async () => {
    const onToggleRealtimeAlerts = vi.fn();

    render(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onToggleActive={vi.fn()}
        onToggleRealtimeAlerts={onToggleRealtimeAlerts}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
        onResetClicked={vi.fn()}
        onChangeAvailability={vi.fn()}
        onUnlockConnector={vi.fn()}
      />,
    );

    // Two switches render in this panel: isActive (admin header) and the
    // AlertsPanel's real-time toggle — the latter is the second one.
    const switches = await screen.findAllByRole("switch");
    fireEvent.click(switches[1]!);

    expect(onToggleRealtimeAlerts).toHaveBeenCalledWith(CHARGE_POINT);
  });
});

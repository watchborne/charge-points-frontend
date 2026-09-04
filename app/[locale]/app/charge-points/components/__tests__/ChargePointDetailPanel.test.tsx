import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const { updateChargePoint } = vi.hoisted(() => ({
  updateChargePoint: vi.fn().mockResolvedValue({}),
}));

// The detail panel now nests ChargePointConsumptionPanel, StatusHistoryPanel,
// AlertsPanel, SecurityEventsPanel and ChargePointReliabilityTile, which fetch
// on mount and format numbers per locale. All are stubbed here so this file
// stays about the detail panel: each nested panel has its own tests.
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
      updateChargePoint,
    },
    StatusHistory: {
      getConnectionEvents: vi.fn().mockResolvedValue([]),
      getConnectorStatusEvents: vi.fn().mockResolvedValue([]),
    },
    SecurityEvents: {
      list: vi.fn().mockResolvedValue([]),
    },
    DeviceEvents: {
      list: vi.fn().mockResolvedValue([]),
    },
    DeviceVariableReports: {
      list: vi.fn().mockResolvedValue([]),
    },
    Uptime: {
      getChargePointUptime: vi.fn().mockResolvedValue({
        chargePointId: "cp-1",
        from: new Date().toISOString(),
        to: new Date().toISOString(),
        onlineMs: 0,
        totalMs: 0,
      }),
    },
  },
}));

vi.mock("next-intl", () => ({
  useLocale: () => "fr",
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values && Object.keys(values).length > 0) {
      const paramList = Object.entries(values)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
      return `${key}(${paramList})`;
    }
    return key;
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

// Stubbed out for the same reason: it fetches its own charging-session
// history. Its own behaviour is covered by ChargingSessionsPanelContainer.test.tsx.
vi.mock("../ChargingSessionsPanelContainer", () => ({
  ChargingSessionsPanelContainer: () => <div data-testid="charging-sessions-panel" />,
}));

import { ChargePointDetailPanel } from "../ChargePointDetailPanel";

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  updateChargePoint.mockClear();
});

// useChargePointActions reads/invalidates through useQueryClient, which
// requires a provider in the tree.
const renderWithQueryClient = (ui: ReactElement) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

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
  it("SHOULD display the connector's lastMeterValue snapshot WHEN one is present", async () => {
    renderWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    // The reading lives in a tooltip, which Radix only mounts once open —
    // focus is the keyboard-equivalent trigger (no hover delay).
    fireEvent.focus(screen.getByLabelText("appPage.chargePoints.detail.lastMeterValue"));

    expect((await screen.findByRole("tooltip")).textContent).toContain("1000 Wh");
  });

  it("SHOULD render no meter value line WHEN the connector never reported one", () => {
    const chargePointWithoutMeterValue = {
      ...CHARGE_POINT,
      connectors: [{ ...CONNECTOR, lastMeterValue: undefined }],
    } as unknown;

    renderWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={chargePointWithoutMeterValue}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    expect(screen.queryByTitle("Last meter reading")).toBeNull();
  });

  it("SHOULD toggle realtime alerts through the API WHEN its switch is toggled", async () => {
    renderWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    // The AlertsPanel only mounts on the "Alerts" tab — Radix Tabs' default
    // "automatic" activation switches on focus, not click — jsdom doesn't
    // move focus as a side effect of a synthetic click the way a real
    // browser does, so it's driven explicitly here (see StatusHistoryPanel's
    // own tab-switching test for the same pattern).
    const alertsTab = screen.getByRole("tab", { name: "appPage.chargePoints.detail.tabs.alerts" });
    fireEvent.mouseDown(alertsTab);
    alertsTab.focus();
    fireEvent.click(alertsTab);

    // Two switches exist once the Alerts tab is active: isActive (header,
    // shown on every tab) and AlertsPanel's real-time toggle — the latter
    // only mounts once AlertsPanelContainer's fetch resolves, so target it
    // by its own label rather than racing on ordinal position.
    const realtimeToggle = await screen.findByRole("switch", {
      name: "Toggle real-time alerts for CP-001",
    });
    fireEvent.click(realtimeToggle);

    expect(updateChargePoint).toHaveBeenCalledWith("cp-1", { realtimeAlertsEnabled: true });
  });

  it("SHOULD default to the Overview tab", () => {
    renderWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    expect(
      screen
        .getByRole("tab", { name: "appPage.chargePoints.detail.tabs.main" })
        .getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("SHOULD switch the active tab WHEN a different tab is clicked", () => {
    renderWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    // Radix Tabs' default "automatic" activation switches on focus, not
    // click — jsdom doesn't move focus as a side effect of a synthetic
    // click the way a real browser does, so it's driven explicitly here.
    const consumptionTab = screen.getByRole("tab", {
      name: "appPage.chargePoints.detail.tabs.consumption",
    });
    fireEvent.mouseDown(consumptionTab);
    consumptionTab.focus();
    fireEvent.click(consumptionTab);

    expect(consumptionTab.getAttribute("aria-selected")).toBe("true");
    expect(
      screen
        .getByRole("tab", { name: "appPage.chargePoints.detail.tabs.main" })
        .getAttribute("aria-selected"),
    ).toBe("false");
  });

  it("SHOULD NOT render the reset control on the Overview tab", () => {
    renderWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    expect(screen.queryByText("appPage.chargePoints.reset.button")).toBeNull();
  });

  it("SHOULD render the reset and availability controls WHEN the Actions tab is active", () => {
    renderWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    const actionsTab = screen.getByRole("tab", {
      name: "appPage.chargePoints.detail.tabs.actions",
    });
    fireEvent.mouseDown(actionsTab);
    actionsTab.focus();
    fireEvent.click(actionsTab);

    expect(actionsTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("appPage.chargePoints.reset.button")).toBeTruthy();
    expect(screen.getByText("appPage.chargePoints.availability.wholeChargePoint")).toBeTruthy();
  });

  it("SHOULD render the charging-session history WHEN the Sessions tab is active", () => {
    renderWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    const sessionsTab = screen.getByRole("tab", {
      name: "appPage.chargePoints.detail.tabs.sessions",
    });
    fireEvent.mouseDown(sessionsTab);
    sessionsTab.focus();
    fireEvent.click(sessionsTab);

    expect(sessionsTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("charging-sessions-panel")).toBeTruthy();
  });
});

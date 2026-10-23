import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode, type ReactElement } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { updateChargePoint } = vi.hoisted(() => ({
  updateChargePoint: vi.fn().mockResolvedValue({}),
}));

// The nested panels fetch on mount and have their own tests: stubbed.
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

// Stubbed: fetches its own state and has its own tests.
vi.mock("../FirmwarePanel", () => ({
  FirmwarePanel: () => null,
}));

// Stubbed, as FirmwarePanel.
vi.mock("../LogUploadPanel", () => ({
  LogUploadPanel: () => null,
}));

// Stubbed, as FirmwarePanel.
vi.mock("../ChargingSessionsPanelContainer", () => ({
  ChargingSessionsPanelContainer: () => <div data-testid="charging-sessions-panel" />,
}));

// Stubbed, as FirmwarePanel.
vi.mock("../ChargePointAlertThresholdsSection", () => ({
  ChargePointAlertThresholdsSection: ({ chargePointId }: { chargePointId: string }) => (
    <div data-testid="alert-thresholds-section">{chargePointId}</div>
  ),
}));

import { ChargePointDetailPanel } from "../ChargePointDetailPanel";

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

const LAST_TAB_STORAGE_KEY = "cp-detail-last-tab";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  updateChargePoint.mockClear();
});

// useChargePointActions needs a QueryClientProvider.
const renderWithQueryClient = (ui: ReactElement) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

// Strict Mode double-invokes mount effects in development, which render()
// doesn't do by default.
const renderStrictWithQueryClient = (ui: ReactElement) =>
  render(
    <StrictMode>
      <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>
    </StrictMode>,
  );

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

    // The Alerts tab activates on focus (Radix "automatic" mode), which jsdom
    // doesn't move on click.
    const alertsTab = screen.getByRole("tab", { name: "appPage.chargePoints.detail.tabs.alerts" });
    fireEvent.mouseDown(alertsTab);
    alertsTab.focus();
    fireEvent.click(alertsTab);

    // The real-time toggle mounts only once the alerts fetch resolves: found
    // by label, not position.
    const realtimeToggle = await screen.findByRole("switch", {
      name: "Toggle real-time alerts for CP-001",
    });
    fireEvent.click(realtimeToggle);

    await waitFor(() =>
      expect(updateChargePoint).toHaveBeenCalledWith("cp-1", { realtimeAlertsEnabled: true }),
    );
  });

  it("SHOULD show the alert thresholds of the charge point on the alerts tab only", async () => {
    renderWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("alert-thresholds-section")).toBeNull();

    const alertsTab = screen.getByRole("tab", { name: "appPage.chargePoints.detail.tabs.alerts" });
    fireEvent.mouseDown(alertsTab);
    alertsTab.focus();
    fireEvent.click(alertsTab);

    expect((await screen.findByTestId("alert-thresholds-section")).textContent).toBe("cp-1");
  });

  it("SHOULD show an error WHEN toggling the active state fails", async () => {
    updateChargePoint.mockRejectedValueOnce(new Error("HTTP error! status: 500"));
    renderWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Toggle CP-001 active state" }));

    await waitFor(() =>
      expect(screen.getByText("appPage.chargePoints.detail.toggleError")).toBeTruthy(),
    );
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

    // Radix tabs activate on focus, which jsdom doesn't move on click.
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

  it("SHOULD preselect the given tab WHEN initialTab is provided", () => {
    renderWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
        initialTab="actions"
      />,
    );

    expect(
      screen
        .getByRole("tab", { name: "appPage.chargePoints.detail.tabs.actions" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.getByText("appPage.chargePoints.reset.button")).toBeTruthy();
  });

  it("SHOULD keep the given initialTab WHEN mounted under React Strict Mode", () => {
    // A "first effect run" flag would be flipped by Strict Mode's double
    // invoke, resetting the tab to "main".
    renderStrictWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
        initialTab="actions"
      />,
    );

    expect(
      screen
        .getByRole("tab", { name: "appPage.chargePoints.detail.tabs.actions" })
        .getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("SHOULD call onTabChange WHEN a different tab is clicked", () => {
    const onTabChange = vi.fn();

    renderWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
        onTabChange={onTabChange}
      />,
    );

    const sessionsTab = screen.getByRole("tab", {
      name: "appPage.chargePoints.detail.tabs.sessions",
    });
    fireEvent.mouseDown(sessionsTab);
    sessionsTab.focus();
    fireEvent.click(sessionsTab);

    expect(onTabChange).toHaveBeenCalledWith("sessions");
  });

  it("SHOULD NOT call onTabChange WHEN a different charge point is selected", () => {
    const onTabChange = vi.fn();

    const { rerender } = renderWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
        initialTab="actions"
        onTabChange={onTabChange}
      />,
    );

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <ChargePointDetailPanel
          chargePoint={{ ...CHARGE_POINT, id: "cp-2" }}
          site={undefined}
          onEditClicked={vi.fn()}
          onDeleteClicked={vi.fn()}
          initialTab="actions"
          onTabChange={onTabChange}
        />
      </QueryClientProvider>,
    );

    // The page already dropped `tab` with the selection: no second URL update.
    expect(
      screen
        .getByRole("tab", { name: "appPage.chargePoints.detail.tabs.main" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it("SHOULD persist the clicked tab to localStorage WHEN a different tab is clicked", () => {
    renderWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    const consumptionTab = screen.getByRole("tab", {
      name: "appPage.chargePoints.detail.tabs.consumption",
    });
    fireEvent.mouseDown(consumptionTab);
    consumptionTab.focus();
    fireEvent.click(consumptionTab);

    expect(localStorage.getItem(LAST_TAB_STORAGE_KEY)).toBe("consumption");
  });

  it("SHOULD default to the last-used tab WHEN localStorage has one and no initialTab is given", () => {
    localStorage.setItem(LAST_TAB_STORAGE_KEY, "consumption");

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
        .getByRole("tab", { name: "appPage.chargePoints.detail.tabs.consumption" })
        .getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("SHOULD prefer initialTab over the stored last-used tab WHEN both are present", () => {
    localStorage.setItem(LAST_TAB_STORAGE_KEY, "consumption");

    renderWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
        initialTab="actions"
      />,
    );

    expect(
      screen
        .getByRole("tab", { name: "appPage.chargePoints.detail.tabs.actions" })
        .getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("SHOULD fall back to the last-used tab instead of Overview WHEN switching to a different charge point", () => {
    localStorage.setItem(LAST_TAB_STORAGE_KEY, "sessions");

    const { rerender } = renderWithQueryClient(
      <ChargePointDetailPanel
        chargePoint={CHARGE_POINT}
        site={undefined}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <ChargePointDetailPanel
          chargePoint={{ ...CHARGE_POINT, id: "cp-2" }}
          site={undefined}
          onEditClicked={vi.fn()}
          onDeleteClicked={vi.fn()}
        />
      </QueryClientProvider>,
    );

    expect(
      screen
        .getByRole("tab", { name: "appPage.chargePoints.detail.tabs.sessions" })
        .getAttribute("aria-selected"),
    ).toBe("true");
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

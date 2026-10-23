import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Alert } from "@watchborne/charge-points-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useLocale: () => "fr",
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    switch (key) {
      case "appPage.chargePoints.alerts.connector":
        return `Connector ${values?.connectorId}`;
      case "appPage.chargePoints.alerts.notifiedTo":
        return `Sent to ${values?.emails}`;
      case "appPage.chargePoints.alerts.openedAt":
        return `Opened ${values?.date}`;
      case "appPage.chargePoints.alerts.resolvedAt":
        return `Resolved ${values?.date}`;
      case "appPage.chargePoints.alerts.acknowledgedBy":
        return `Acknowledged by ${values?.email}`;
      default:
        return key;
    }
  },
}));

const { getAlerts, acknowledgeAlert } = vi.hoisted(() => ({
  getAlerts: vi.fn(),
  acknowledgeAlert: vi.fn(),
}));

vi.mock("../../../../../../lib/api", () => ({
  api: { ChargePoints: { getAlerts, acknowledgeAlert } },
}));

import * as csv from "../../../../../../lib/csv";
import { AlertsPanelContainer } from "../AlertsPanelContainer";

afterEach(() => cleanup());

const CP_ID = "cp-1";
const AT = new Date("2026-08-09T12:00:00Z");

const buildAlert = (overrides: Partial<Alert> = {}): Alert =>
  ({
    id: "alert-1",
    chargePointId: CP_ID,
    connectorId: null,
    type: "OFFLINE",
    status: "OPEN",
    openedAt: AT,
    resolvedAt: null,
    lastNotifiedAt: AT,
    notificationCount: 1,
    notifiedRecipients: [
      { userId: "44444444-4444-4444-8444-444444444444", email: "alice@example.com" },
    ],
    acknowledgedAt: null,
    acknowledgedBy: null,
    createdAt: AT,
    updatedAt: AT,
    ...overrides,
  }) as Alert;

const resolveWith = (alerts: Alert[]) => getAlerts.mockResolvedValue(alerts);

let queryClient: QueryClient;

const renderPanel = ({
  chargePointId = CP_ID,
  realtimeAlertsEnabled = false,
  onToggleRealtimeAlerts = vi.fn(),
}: {
  chargePointId?: string;
  realtimeAlertsEnabled?: boolean;
  onToggleRealtimeAlerts?: () => void;
} = {}) =>
  render(
    <QueryClientProvider client={queryClient}>
      <AlertsPanelContainer
        chargePointId={chargePointId}
        chargePointName="CP-001"
        realtimeAlertsEnabled={realtimeAlertsEnabled}
        onToggleRealtimeAlerts={onToggleRealtimeAlerts}
      />
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  resolveWith([]);
  acknowledgeAlert.mockResolvedValue(buildAlert());
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

describe("AlertsPanelContainer", () => {
  it("SHOULD say there are no alerts WHEN the history is empty", async () => {
    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.alerts.empty")).toBeTruthy();
  });

  it("SHOULD render the alert's type and lifecycle status", async () => {
    resolveWith([buildAlert({ type: "CONNECTOR_FAULTED", status: "OPEN" })]);

    renderPanel();

    expect(
      await screen.findByText("appPage.chargePoints.alerts.types.CONNECTOR_FAULTED"),
    ).toBeTruthy();
    expect(screen.getByText("appPage.chargePoints.alerts.status.open")).toBeTruthy();
  });

  it("SHOULD render a SECURITY_EVENT alert as station-wide, with no connector qualifier", async () => {
    resolveWith([buildAlert({ type: "SECURITY_EVENT", status: "RESOLVED", connectorId: null })]);

    renderPanel();

    expect(
      await screen.findByText("appPage.chargePoints.alerts.types.SECURITY_EVENT"),
    ).toBeTruthy();
    expect(screen.queryByText(/^Connector /)).toBeNull();
  });

  it("SHOULD show the connector number WHEN the alert is connector-scoped", async () => {
    resolveWith([buildAlert({ type: "CONNECTOR_FAULTED", connectorId: 2 })]);

    renderPanel();

    expect(await screen.findByText("Connector 2")).toBeTruthy();
  });

  it("SHOULD NOT show a connector qualifier WHEN the alert is charge-point-wide", async () => {
    resolveWith([buildAlert({ type: "OFFLINE", connectorId: null })]);

    renderPanel();

    await screen.findByText("appPage.chargePoints.alerts.types.OFFLINE");
    expect(screen.queryByText(/^Connector /)).toBeNull();
  });

  it("SHOULD show who an alert was sent to and mark it sent WHEN it has notified someone", async () => {
    resolveWith([
      buildAlert({
        notificationCount: 2,
        lastNotifiedAt: AT,
        notifiedRecipients: [
          { userId: "44444444-4444-4444-8444-444444444444", email: "alice@example.com" },
          { userId: "55555555-5555-4555-8555-555555555555", email: "bob@example.com" },
        ],
      }),
    ]);

    renderPanel();

    expect(await screen.findByText("Sent to alice@example.com, bob@example.com")).toBeTruthy();
  });

  it("SHOULD say an alert has not been sent yet WHEN it has never notified anyone", async () => {
    resolveWith([
      buildAlert({ notificationCount: 0, lastNotifiedAt: null, notifiedRecipients: [] }),
    ]);

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.alerts.notNotified")).toBeTruthy();
  });

  it("SHOULD surface a load failure rather than rendering an empty panel", async () => {
    getAlerts.mockRejectedValue(new Error("boom"));

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.alerts.loadError")).toBeTruthy();
  });

  it("SHOULD cap the fetch to the panel's visible alert count", async () => {
    renderPanel();

    await waitFor(() => expect(getAlerts).toHaveBeenCalledWith(CP_ID, 5));
  });

  it("SHOULD refetch WHEN a different charge point is opened", async () => {
    const { rerender } = renderPanel();
    await waitFor(() => expect(getAlerts).toHaveBeenCalledWith(CP_ID, 5));

    rerender(
      <QueryClientProvider client={queryClient}>
        <AlertsPanelContainer
          chargePointId="cp-2"
          chargePointName="CP-002"
          realtimeAlertsEnabled={false}
          onToggleRealtimeAlerts={vi.fn()}
        />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(getAlerts).toHaveBeenCalledWith("cp-2", 5));
  });

  it("SHOULD reflect realtimeAlertsEnabled in the toggle's checked state", async () => {
    renderPanel({ realtimeAlertsEnabled: true });

    expect((await screen.findByRole("switch")).getAttribute("aria-checked")).toBe("true");
  });

  it("SHOULD call onToggleRealtimeAlerts WHEN the toggle is clicked", async () => {
    const onToggleRealtimeAlerts = vi.fn();
    renderPanel({ realtimeAlertsEnabled: false, onToggleRealtimeAlerts });

    fireEvent.click(await screen.findByRole("switch"));

    expect(onToggleRealtimeAlerts).toHaveBeenCalledTimes(1);
  });

  // Acknowledging never resolves the alert, whatever the button's wording.
  const acknowledgeButton = () =>
    screen.findByRole("button", { name: "appPage.chargePoints.alerts.acknowledge" });

  it("SHOULD offer to acknowledge an alert WHEN it is open and nobody has taken it on", async () => {
    resolveWith([buildAlert({ status: "OPEN" })]);

    renderPanel();

    expect(await acknowledgeButton()).toBeTruthy();
  });

  it("SHOULD NOT offer to acknowledge an alert WHEN it is already resolved", async () => {
    resolveWith([buildAlert({ status: "RESOLVED", resolvedAt: AT })]);

    renderPanel();

    await screen.findByText("appPage.chargePoints.alerts.status.resolved");
    expect(
      screen.queryByRole("button", { name: "appPage.chargePoints.alerts.acknowledge" }),
    ).toBeNull();
  });

  it("SHOULD name who took an alert on instead of offering the action WHEN it is already acknowledged", async () => {
    resolveWith([
      buildAlert({
        status: "OPEN",
        acknowledgedAt: AT,
        acknowledgedBy: {
          userId: "44444444-4444-4444-8444-444444444444",
          email: "alice@example.com",
        },
      }),
    ]);

    renderPanel();

    expect(await screen.findByText(/Acknowledged by alice@example.com/)).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "appPage.chargePoints.alerts.acknowledge" }),
    ).toBeNull();
  });

  it("SHOULD acknowledge the alert WHEN the action is clicked", async () => {
    resolveWith([buildAlert({ id: "alert-7", status: "OPEN" })]);

    renderPanel();
    fireEvent.click(await acknowledgeButton());

    await waitFor(() => expect(acknowledgeAlert).toHaveBeenCalledWith(CP_ID, "alert-7"));
  });

  it("SHOULD refetch the alert list WHEN an acknowledgment succeeds", async () => {
    resolveWith([buildAlert({ status: "OPEN" })]);

    renderPanel();
    await waitFor(() => expect(getAlerts).toHaveBeenCalledTimes(1));
    fireEvent.click(await acknowledgeButton());

    await waitFor(() => expect(getAlerts).toHaveBeenCalledTimes(2));
  });

  it("SHOULD surface an acknowledgment failure rather than silently leaving the alert untouched", async () => {
    resolveWith([buildAlert({ status: "OPEN" })]);
    acknowledgeAlert.mockRejectedValue(new Error("boom"));

    renderPanel();
    fireEvent.click(await acknowledgeButton());

    expect(await screen.findByText("appPage.chargePoints.alerts.acknowledgeError")).toBeTruthy();
  });
});

describe("AlertsPanelContainer CSV export", () => {
  it("SHOULD fetch the longer history and download it WHEN the export button is clicked", async () => {
    const downloadCsv = vi.spyOn(csv, "downloadCsv").mockImplementation(() => {});
    getAlerts.mockResolvedValue([buildAlert()]);
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "common.exportCsv" }));

    await waitFor(() => expect(downloadCsv).toHaveBeenCalledOnce());
    expect(getAlerts).toHaveBeenLastCalledWith(CP_ID, 100);
    const [filename, rows] = downloadCsv.mock.calls[0];
    expect(filename).toMatch(/^alerts-.*-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(rows[1].slice(0, 6)).toEqual([
      "OFFLINE",
      null,
      "OPEN",
      "2026-08-09T12:00:00.000Z",
      null,
      "alice@example.com",
    ]);
  });
});

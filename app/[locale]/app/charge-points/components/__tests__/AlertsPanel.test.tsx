import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Alert } from "@watchborne/charge-points-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
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
      default:
        return key;
    }
  },
}));

// `vi.hoisted` because vi.mock factories are hoisted above these declarations —
// the repo's existing pattern (see FirmwarePanel.test.tsx).
const { getAlerts } = vi.hoisted(() => ({ getAlerts: vi.fn() }));

// Mocked via the relative module path, not the "@/lib/api" alias: this project's
// Vitest config does not alias "@/" for the mock resolver, so an aliased target
// silently fails to intercept and the real fetch runs. Repo convention — see
// FirmwarePanel.test.tsx.
vi.mock("../../../../../../lib/api", () => ({
  api: { ChargePoints: { getAlerts } },
}));

import { AlertsPanel } from "../AlertsPanel";

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
    createdAt: AT,
    updatedAt: AT,
    ...overrides,
  }) as Alert;

const resolveWith = (alerts: Alert[]) => getAlerts.mockResolvedValue(alerts);

beforeEach(() => {
  vi.clearAllMocks();
  resolveWith([]);
});

describe("AlertsPanel", () => {
  it("SHOULD say there are no alerts WHEN the history is empty", async () => {
    render(<AlertsPanel chargePointId={CP_ID} />);

    expect(await screen.findByText("appPage.chargePoints.alerts.empty")).toBeTruthy();
  });

  it("SHOULD render the alert's type and lifecycle status", async () => {
    resolveWith([buildAlert({ type: "CONNECTOR_FAULTED", status: "OPEN" })]);

    render(<AlertsPanel chargePointId={CP_ID} />);

    expect(
      await screen.findByText("appPage.chargePoints.alerts.types.CONNECTOR_FAULTED"),
    ).toBeTruthy();
    expect(screen.getByText("appPage.chargePoints.alerts.status.open")).toBeTruthy();
  });

  it("SHOULD show the connector number WHEN the alert is connector-scoped", async () => {
    resolveWith([buildAlert({ type: "CONNECTOR_FAULTED", connectorId: 2 })]);

    render(<AlertsPanel chargePointId={CP_ID} />);

    expect(await screen.findByText("Connector 2")).toBeTruthy();
  });

  it("SHOULD NOT show a connector qualifier WHEN the alert is charge-point-wide", async () => {
    resolveWith([buildAlert({ type: "OFFLINE", connectorId: null })]);

    render(<AlertsPanel chargePointId={CP_ID} />);

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

    render(<AlertsPanel chargePointId={CP_ID} />);

    expect(await screen.findByText("Sent to alice@example.com, bob@example.com")).toBeTruthy();
  });

  it("SHOULD say an alert has not been sent yet WHEN it has never notified anyone", async () => {
    resolveWith([
      buildAlert({ notificationCount: 0, lastNotifiedAt: null, notifiedRecipients: [] }),
    ]);

    render(<AlertsPanel chargePointId={CP_ID} />);

    expect(await screen.findByText("appPage.chargePoints.alerts.notNotified")).toBeTruthy();
  });

  it("SHOULD surface a load failure rather than rendering an empty panel", async () => {
    getAlerts.mockRejectedValue(new Error("boom"));

    render(<AlertsPanel chargePointId={CP_ID} />);

    expect(await screen.findByText("appPage.chargePoints.alerts.loadError")).toBeTruthy();
  });

  it("SHOULD cap the fetch to the panel's visible alert count", async () => {
    render(<AlertsPanel chargePointId={CP_ID} />);

    await waitFor(() => expect(getAlerts).toHaveBeenCalledWith(CP_ID, 5));
  });

  it("SHOULD refetch WHEN a different charge point is opened", async () => {
    const { rerender } = render(<AlertsPanel chargePointId={CP_ID} />);
    await waitFor(() => expect(getAlerts).toHaveBeenCalledWith(CP_ID, 5));

    rerender(<AlertsPanel chargePointId="cp-2" />);

    await waitFor(() => expect(getAlerts).toHaveBeenCalledWith("cp-2", 5));
  });
});

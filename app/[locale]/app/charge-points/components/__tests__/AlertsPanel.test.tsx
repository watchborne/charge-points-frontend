import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
}));

import { type AlertListEntry, AlertsPanel } from "../AlertsPanel";

afterEach(() => cleanup());

const alert: AlertListEntry = {
  id: "alert-1",
  type: "OFFLINE",
  status: "OPEN",
  connectorId: null,
  notificationCount: 1,
  openedAt: "2026-10-08T12:00:00.000Z",
  resolvedAt: null,
  lastNotifiedAt: null,
  notifiedRecipients: [],
};

const renderPanel = (alerts: AlertListEntry[]) =>
  render(
    <AlertsPanel
      chargePointName="CP-A"
      realtimeAlertsEnabled={false}
      onToggleRealtimeAlerts={vi.fn()}
      alerts={alerts}
    />,
  );

describe("AlertsPanel", () => {
  it("SHOULD show the empty message WHEN there is no alert", () => {
    renderPanel([]);

    expect(screen.getByText("appPage.chargePoints.alerts.empty")).toBeTruthy();
  });

  it("SHOULD list the alerts INSTEAD OF the empty message WHEN there are some", () => {
    renderPanel([alert]);

    expect(screen.getByText("appPage.chargePoints.alerts.types.OFFLINE")).toBeTruthy();
    expect(screen.queryByText("appPage.chargePoints.alerts.empty")).toBeNull();
  });
});

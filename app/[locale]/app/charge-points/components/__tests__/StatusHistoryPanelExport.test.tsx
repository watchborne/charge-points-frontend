import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { downloadCsv } = vi.hoisted(() => ({ downloadCsv: vi.fn() }));

vi.mock("next-intl", () => ({
  useLocale: () => "fr",
  useTranslations: () => (key: string) => key,
}));

vi.mock("../../../../../../lib/csv", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../../lib/csv")>()),
  downloadCsv,
}));

import { StatusHistoryPanel } from "../StatusHistoryPanel";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderPanel = (connectionEvents: { status: string; occurredAt: string }[]) =>
  render(
    <StatusHistoryPanel
      range="day"
      ranges={["day"]}
      onRangeChange={vi.fn()}
      connectorId={1}
      connectorIds={[1]}
      onConnectorIdChange={vi.fn()}
      windowStart={new Date("2026-08-01T00:00:00Z")}
      windowEnd={new Date("2026-08-02T00:00:00Z")}
      connectionEvents={connectionEvents as never}
      connectorEvents={[{ status: "Charging", occurredAt: "2026-08-01T10:00:00.000Z" }] as never}
      truncated={false}
    />,
  );

describe("StatusHistoryPanel CSV export", () => {
  it("SHOULD export every transition oldest first WHEN the export button is clicked", () => {
    renderPanel([
      { status: "ONLINE", occurredAt: "2026-08-01T08:00:00.000Z" },
      { status: "OFFLINE", occurredAt: "2026-08-01T06:00:00.000Z" },
    ]);

    fireEvent.click(screen.getByRole("button", { name: "common.exportCsv" }));

    const [filename, rows] = downloadCsv.mock.calls[0];
    expect(filename).toMatch(/^status-history-day-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(rows.slice(1)).toEqual([
      ["appPage.chargePoints.statusHistory.connectivity", "2026-08-01T06:00:00.000Z", "OFFLINE"],
      ["appPage.chargePoints.statusHistory.connectivity", "2026-08-01T08:00:00.000Z", "ONLINE"],
      [
        "appPage.chargePoints.statusHistory.connectorStatus",
        "2026-08-01T10:00:00.000Z",
        "Charging",
      ],
    ]);
  });
});

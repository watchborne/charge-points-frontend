import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      "appPage.chargePoints.statusHistory.title": "Status history",
      "appPage.chargePoints.statusHistory.connectivity": "Connectivity",
      "appPage.chargePoints.statusHistory.connectorStatus": `Connector ${values?.connectorId} status`,
      "appPage.chargePoints.statusHistory.connectorLabel": "Connector",
      "appPage.chargePoints.statusHistory.noData": "No data",
      "appPage.chargePoints.statusHistory.truncated": "Truncated to 500 transitions",
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

vi.mock("../../../../../../lib/api", () => ({
  api: {
    StatusHistory: {
      getConnectionEvents: vi.fn().mockResolvedValue([]),
      getConnectorStatusEvents: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { api } from "../../../../../../lib/api";
import { StatusHistoryPanel } from "../StatusHistoryPanel";

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.StatusHistory.getConnectionEvents).mockResolvedValue([]);
  vi.mocked(api.StatusHistory.getConnectorStatusEvents).mockResolvedValue([]);
});

afterEach(() => cleanup());

const CONNECTION_EVENT = {
  id: "e1",
  chargePointId: "cp-1",
  status: "SYNCED" as const,
  previousStatus: "CONNECTED" as const,
  occurredAt: "2026-08-09T00:00:00.000Z",
  createdAt: "2026-08-09T00:00:00.000Z",
};

const CONNECTOR_EVENT = {
  id: "e2",
  chargePointId: "cp-1",
  connectorId: 1,
  status: "Charging",
  previousStatus: "Available",
  occurredAt: "2026-08-09T00:00:00.000Z",
  createdAt: "2026-08-09T00:00:00.000Z",
};

describe("StatusHistoryPanel", () => {
  it("SHOULD render two timeline bars (connectivity and connector status) by default", async () => {
    render(<StatusHistoryPanel chargePointId="cp-1" connectorIds={[1]} />);

    await waitFor(() => expect(screen.getByRole("img", { name: "Connectivity" })).toBeDefined());
    expect(screen.getByRole("img", { name: "Connector 1 status" })).toBeDefined();
  });

  it("SHOULD load both streams for the charge point and default connector", async () => {
    render(<StatusHistoryPanel chargePointId="cp-1" connectorIds={[1, 2]} />);

    await waitFor(() => expect(api.StatusHistory.getConnectionEvents).toHaveBeenCalled());

    expect(api.StatusHistory.getConnectionEvents).toHaveBeenCalledWith(
      "cp-1",
      expect.objectContaining({}),
    );
    expect(api.StatusHistory.getConnectorStatusEvents).toHaveBeenCalledWith(
      "cp-1",
      expect.objectContaining({ connectorId: 1 }),
    );
  });

  it("SHOULD show a connector selector only WHEN there is more than one connector", async () => {
    const { rerender } = render(<StatusHistoryPanel chargePointId="cp-1" connectorIds={[1]} />);
    await waitFor(() => expect(api.StatusHistory.getConnectionEvents).toHaveBeenCalled());

    expect(screen.queryByLabelText("Connector")).toBeNull();

    rerender(<StatusHistoryPanel chargePointId="cp-1" connectorIds={[1, 2]} />);
    await waitFor(() => expect(screen.queryByLabelText("Connector")).not.toBeNull());
  });

  it("SHOULD switch to breakdown tables WHEN the 30-day tab is selected", async () => {
    vi.mocked(api.StatusHistory.getConnectionEvents).mockResolvedValue([CONNECTION_EVENT]);
    vi.mocked(api.StatusHistory.getConnectorStatusEvents).mockResolvedValue([CONNECTOR_EVENT]);

    render(<StatusHistoryPanel chargePointId="cp-1" connectorIds={[1]} />);
    await waitFor(() => expect(screen.getByRole("img", { name: "Connectivity" })).toBeDefined());

    // Radix Tabs' default "automatic" activation switches on focus, not
    // click — jsdom doesn't move focus as a side effect of a synthetic
    // click the way a real browser does, so it's driven explicitly here.
    const tab30d = screen.getByRole("tab", { name: "30d" }) as HTMLElement;
    fireEvent.mouseDown(tab30d);
    tab30d.focus();
    fireEvent.click(tab30d);

    await waitFor(() => expect(screen.queryByRole("img", { name: "Connectivity" })).toBeNull());
    expect(screen.getAllByText("Timestamp").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Duration").length).toBeGreaterThan(0);
  });

  it("SHOULD render an error callout WHEN loading fails", async () => {
    vi.mocked(api.StatusHistory.getConnectionEvents).mockRejectedValue(new Error("boom"));

    render(<StatusHistoryPanel chargePointId="cp-1" connectorIds={[1]} />);

    await waitFor(() => expect(screen.getByText("Failed to load status history.")).toBeDefined());
  });

  it("SHOULD show the truncated notice WHEN a stream hits the fetch limit", async () => {
    vi.mocked(api.StatusHistory.getConnectorStatusEvents).mockResolvedValue(
      Array.from({ length: 500 }, (_, i) => ({ ...CONNECTOR_EVENT, id: `${i}` })),
    );

    render(<StatusHistoryPanel chargePointId="cp-1" connectorIds={[1]} />);

    await waitFor(() => expect(screen.getByText("Truncated to 500 transitions")).toBeDefined());
  });

  it("SHOULD NOT show the truncated notice WHEN neither stream hits the fetch limit", async () => {
    render(<StatusHistoryPanel chargePointId="cp-1" connectorIds={[1]} />);

    await waitFor(() => expect(screen.getByRole("img", { name: "Connectivity" })).toBeDefined());
    expect(screen.queryByText("Truncated to 500 transitions")).toBeNull();
  });
});

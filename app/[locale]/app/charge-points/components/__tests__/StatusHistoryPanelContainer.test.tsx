import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
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
import { StatusHistoryPanelContainer } from "../StatusHistoryPanelContainer";

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

describe("StatusHistoryPanelContainer", () => {
  it("SHOULD render two timeline bars (connectivity and connector status) by default", async () => {
    render(<StatusHistoryPanelContainer chargePointId="cp-1" connectorIds={[1]} />);

    await waitFor(() =>
      expect(
        screen.getByRole("img", { name: "appPage.chargePoints.statusHistory.connectivity" }),
      ).toBeDefined(),
    );
    expect(
      screen.getByRole("img", { name: "appPage.chargePoints.statusHistory.connectorStatus" }),
    ).toBeDefined();
  });

  it("SHOULD load both streams for the charge point and default connector", async () => {
    render(<StatusHistoryPanelContainer chargePointId="cp-1" connectorIds={[1, 2]} />);

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
    const { rerender } = render(
      <StatusHistoryPanelContainer chargePointId="cp-1" connectorIds={[1]} />,
    );
    await waitFor(() => expect(api.StatusHistory.getConnectionEvents).toHaveBeenCalled());

    expect(screen.queryByLabelText("appPage.chargePoints.statusHistory.connectorLabel")).toBeNull();

    rerender(<StatusHistoryPanelContainer chargePointId="cp-1" connectorIds={[1, 2]} />);
    await waitFor(() =>
      expect(
        screen.queryByLabelText("appPage.chargePoints.statusHistory.connectorLabel"),
      ).not.toBeNull(),
    );
  });

  it("SHOULD switch to breakdown tables WHEN the 30-day tab is selected", async () => {
    vi.mocked(api.StatusHistory.getConnectionEvents).mockResolvedValue([CONNECTION_EVENT]);
    vi.mocked(api.StatusHistory.getConnectorStatusEvents).mockResolvedValue([CONNECTOR_EVENT]);

    render(<StatusHistoryPanelContainer chargePointId="cp-1" connectorIds={[1]} />);
    await waitFor(() =>
      expect(
        screen.getByRole("img", {
          name: "appPage.chargePoints.statusHistory.connectivity",
        }),
      ).toBeDefined(),
    );

    // Radix Tabs' default "automatic" activation switches on focus, not
    // click — jsdom doesn't move focus as a side effect of a synthetic
    // click the way a real browser does, so it's driven explicitly here.
    const tab30d = screen.getByRole("tab", {
      name: "appPage.chargePoints.statusHistory.ranges.30d",
    }) as HTMLElement;
    fireEvent.mouseDown(tab30d);
    tab30d.focus();
    fireEvent.click(tab30d);

    await waitFor(() =>
      expect(
        screen.queryByRole("img", { name: "appPage.chargePoints.statusHistory.connectivity" }),
      ).toBeNull(),
    );
    expect(
      screen.getAllByText("appPage.chargePoints.statusHistory.table.timestamp").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("appPage.chargePoints.statusHistory.table.duration").length,
    ).toBeGreaterThan(0);
  });

  it("SHOULD render an error callout WHEN loading fails", async () => {
    vi.mocked(api.StatusHistory.getConnectionEvents).mockRejectedValue(new Error("boom"));

    render(<StatusHistoryPanelContainer chargePointId="cp-1" connectorIds={[1]} />);

    await waitFor(() =>
      expect(screen.getByText("appPage.chargePoints.statusHistory.error")).toBeDefined(),
    );
  });

  it("SHOULD show the truncated notice WHEN a stream hits the fetch limit", async () => {
    vi.mocked(api.StatusHistory.getConnectorStatusEvents).mockResolvedValue(
      Array.from({ length: 500 }, (_, i) => ({ ...CONNECTOR_EVENT, id: `${i}` })),
    );

    render(<StatusHistoryPanelContainer chargePointId="cp-1" connectorIds={[1]} />);

    await waitFor(() =>
      expect(screen.getByText("appPage.chargePoints.statusHistory.truncated")).toBeDefined(),
    );
  });

  it("SHOULD NOT show the truncated notice WHEN neither stream hits the fetch limit", async () => {
    render(<StatusHistoryPanelContainer chargePointId="cp-1" connectorIds={[1]} />);

    await waitFor(() =>
      expect(
        screen.getByRole("img", { name: "appPage.chargePoints.statusHistory.connectivity" }),
      ).toBeDefined(),
    );
    expect(screen.queryByText("Truncated to 500 transitions")).toBeNull();
  });
});

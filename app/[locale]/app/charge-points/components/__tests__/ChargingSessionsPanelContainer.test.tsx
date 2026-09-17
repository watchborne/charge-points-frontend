import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ChargingSession } from "@watchborne/charge-points-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A fixed, locale-agnostic stand-in for the real Intl-backed formatter — what
// matters here is that the cost column calls it, not the exact rendered
// string, which is next-intl's own concern (see CommissioningTokenPanel.test.tsx).
const formatter = {
  number: (value: number) => `formatted:${value}`,
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => formatter,
}));

// `vi.hoisted` because vi.mock factories are hoisted above these declarations —
// the repo's existing pattern (see LogUploadPanel.test.tsx).
const { listChargingSessions, getChargingSessionCost } = vi.hoisted(() => ({
  listChargingSessions: vi.fn(),
  getChargingSessionCost: vi.fn(),
}));

// Mocked via the relative module path, not the "@/lib/api" alias: this project's
// Vitest config does not alias "@/" for the mock resolver, so an aliased target
// silently fails to intercept and the real fetch runs. Repo convention — see
// LogUploadPanel.test.tsx.
vi.mock("../../../../../../lib/api", () => ({
  api: { ChargePoints: { listChargingSessions, getChargingSessionCost } },
}));

// Stubbed out: it fetches its own meter samples. Its own behaviour is
// covered by SessionConsumptionChartContainer.test.tsx — this suite only
// needs to know the panel renders it once expanded.
vi.mock("../SessionConsumptionChartContainer", () => ({
  SessionConsumptionChartContainer: ({ connectorId }: { connectorId: number }) => (
    <div data-testid="session-consumption-chart" data-connector={connectorId} />
  ),
}));

import { ChargingSessionsPanelContainer } from "../ChargingSessionsPanelContainer";

afterEach(() => cleanup());

const CP_ID = "cp-1";
const AT = new Date("2026-08-31T10:00:00Z");

const buildSession = (overrides: Partial<ChargingSession> = {}): ChargingSession =>
  ({
    id: "session-1",
    chargePointId: CP_ID,
    connectorId: 1,
    transactionId: "1",
    idTag: "04A1B2C3",
    meterStart: 1000,
    meterStop: 5000,
    status: "ENDED",
    stoppedReason: "Local",
    startedAt: AT,
    endedAt: new Date("2026-08-31T10:45:00Z"),
    createdAt: AT,
    updatedAt: new Date("2026-08-31T10:45:00Z"),
    ...overrides,
  }) as ChargingSession;

const buildCost = (
  overrides: Partial<{
    amountCents: number | null;
    currency: string | null;
    reason: string | null;
  }> = {},
) => ({
  sessionId: "session-1",
  chargePointId: CP_ID,
  energyWh: 4000,
  currency: "EUR",
  pricePerKwhCents: 25,
  amountCents: 100,
  reason: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  listChargingSessions.mockResolvedValue([]);
  // A rejection by default (rather than a resolved envelope) exercises the
  // container's own "leave that row's cost undefined" fallback for every
  // test that isn't specifically about the cost column below.
  getChargingSessionCost.mockRejectedValue(new Error("no cost configured"));
});

const renderPanel = () => render(<ChargingSessionsPanelContainer chargePointId={CP_ID} />);

describe("ChargingSessionsPanelContainer", () => {
  it("SHOULD show a loading state WHILE fetching", () => {
    renderPanel();

    expect(screen.getByText("appPage.chargePoints.chargingSessions.loading")).toBeTruthy();
  });

  it("SHOULD say so WHEN the charge point has no charging sessions", async () => {
    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.chargingSessions.empty")).toBeTruthy();
  });

  it("SHOULD render an ENDED session with its energy delivered", async () => {
    listChargingSessions.mockResolvedValue([buildSession()]);

    renderPanel();

    expect(
      await screen.findByText("appPage.chargePoints.chargingSessions.statuses.ENDED"),
    ).toBeTruthy();
    expect(
      screen.getByText("appPage.chargePoints.chargingSessions.stoppedReasons.Local"),
    ).toBeTruthy();
    expect(screen.getByText("4,000 Wh")).toBeTruthy();
  });

  it("SHOULD render an ACTIVE session with no energy figure, since 2.0.1 carries no meterStart/meterStop", async () => {
    listChargingSessions.mockResolvedValue([
      buildSession({
        id: "session-2",
        evseId: 1,
        meterStart: undefined,
        meterStop: undefined,
        status: "ACTIVE",
        stoppedReason: undefined,
        endedAt: null,
      }),
    ]);

    renderPanel();

    expect(
      await screen.findByText("appPage.chargePoints.chargingSessions.statuses.ACTIVE"),
    ).toBeTruthy();
    // Both the energy cell (no meterStart/meterStop) and the cost cell (the
    // mocked lookup rejects by default, see beforeEach) fall back to a dash.
    expect(await screen.findAllByText("—")).toHaveLength(2);
  });

  it("SHOULD render an estimated cost through the formatter WHEN one is available", async () => {
    listChargingSessions.mockResolvedValue([buildSession()]);
    getChargingSessionCost.mockResolvedValue(buildCost({ amountCents: 875 }));

    renderPanel();

    expect(await screen.findByText("formatted:8.75")).toBeTruthy();
  });

  it("SHOULD say a tariff is missing rather than a bare dash WHEN the site has none configured", async () => {
    listChargingSessions.mockResolvedValue([buildSession()]);
    getChargingSessionCost.mockResolvedValue(
      buildCost({ amountCents: null, currency: null, reason: "NO_TARIFF_CONFIGURED" }),
    );

    renderPanel();

    expect(
      await screen.findByText(
        "appPage.chargePoints.chargingSessions.costReasons.NO_TARIFF_CONFIGURED",
      ),
    ).toBeTruthy();
  });

  it("SHOULD surface a load failure rather than rendering an empty panel", async () => {
    listChargingSessions.mockRejectedValue(new Error("boom"));

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.chargingSessions.loadError")).toBeTruthy();
  });

  it("SHOULD expand a session's consumption chart WHEN its toggle is clicked", async () => {
    listChargingSessions.mockResolvedValue([buildSession()]);

    renderPanel();
    await screen.findByText("appPage.chargePoints.chargingSessions.statuses.ENDED");

    expect(screen.queryByTestId("session-consumption-chart")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", {
        name: "appPage.chargePoints.chargingSessions.consumption.show",
      }),
    );

    const chart = screen.getByTestId("session-consumption-chart");
    expect(chart.getAttribute("data-connector")).toBe("1");
  });

  it("SHOULD refetch WHEN a different charge point is opened", async () => {
    const { rerender } = renderPanel();
    await waitFor(() => expect(listChargingSessions).toHaveBeenCalledWith(CP_ID, 20));

    rerender(<ChargingSessionsPanelContainer chargePointId="cp-2" />);

    await waitFor(() => expect(listChargingSessions).toHaveBeenCalledWith("cp-2", 20));
  });
});

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

// Recharts renders into a ResponsiveContainer that measures 0x0 under jsdom, so
// the SVG never appears — stubbed to a marker carrying the props this
// component is responsible for choosing, same pattern as
// ChargePointConsumptionPanelContainer.test.tsx.
vi.mock("../ConsumptionChart", () => ({
  ConsumptionChart: ({
    connectorIds,
    measurand,
    unit,
    samples,
  }: {
    connectorIds: number[];
    measurand: string;
    unit?: string;
    samples: unknown[];
  }) => (
    <div
      data-testid="chart"
      data-connectors={connectorIds.join(",")}
      data-measurand={measurand}
      data-unit={unit}
      data-samples={samples.length}
    />
  ),
}));

vi.mock("../../../../../../lib/api", () => ({
  api: {
    Metering: { getConsumption: vi.fn(), getMeterSamples: vi.fn() },
  },
}));

import { api } from "../../../../../../lib/api";
import { SessionConsumptionChart } from "../SessionConsumptionChart";

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const STARTED_AT = new Date("2026-08-31T10:00:00Z");
const ENDED_AT = new Date("2026-08-31T10:45:00Z");

const series = (overrides: Record<string, unknown> = {}) => ({
  connectorId: 1,
  measurand: "Energy.Active.Import.Register",
  unit: "Wh",
  min: 1000,
  max: 4000,
  avg: 2500,
  sampleCount: 10,
  firstMeasuredAt: STARTED_AT.toISOString(),
  lastMeasuredAt: ENDED_AT.toISOString(),
  ...overrides,
});

const sample = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  chargePointId: "cp-1",
  connectorId: 1,
  measuredAt: ENDED_AT.toISOString(),
  measurand: "Energy.Active.Import.Register",
  unit: "Wh",
  value: 4000,
  createdAt: ENDED_AT.toISOString(),
  ...overrides,
});

const given = ({
  seriesList = [series()],
  samples = [sample()],
}: {
  seriesList?: ReturnType<typeof series>[];
  samples?: ReturnType<typeof sample>[];
} = {}) => {
  vi.mocked(api.Metering.getConsumption).mockResolvedValue({
    chargePointId: "cp-1",
    from: STARTED_AT.toISOString(),
    to: ENDED_AT.toISOString(),
    series: seriesList,
  });
  vi.mocked(api.Metering.getMeterSamples).mockResolvedValue(samples);
};

describe("SessionConsumptionChart", () => {
  it("SHOULD scope the fetch to the session's connector and timeframe", async () => {
    given();
    render(
      <SessionConsumptionChart
        chargePointId="cp-1"
        connectorId={1}
        startedAt={STARTED_AT}
        endedAt={ENDED_AT}
      />,
    );

    await waitFor(() =>
      expect(api.Metering.getConsumption).toHaveBeenCalledWith(
        "cp-1",
        expect.objectContaining({ connectorId: 1, from: STARTED_AT, to: ENDED_AT }),
      ),
    );
  });

  it("SHOULD default to the cumulative energy register WHEN the station reported one", async () => {
    given({
      seriesList: [
        series({ measurand: "Voltage", unit: "V" }),
        series({ measurand: "Energy.Active.Import.Register", unit: "Wh" }),
      ],
      samples: [sample({ measurand: "Energy.Active.Import.Register", unit: "Wh" })],
    });
    render(
      <SessionConsumptionChart
        chargePointId="cp-1"
        connectorId={1}
        startedAt={STARTED_AT}
        endedAt={ENDED_AT}
      />,
    );

    const chart = await screen.findByTestId("chart");
    expect(chart.getAttribute("data-measurand")).toBe("Energy.Active.Import.Register");
  });

  it("SHOULD fetch up to now WHEN the session is still active (no endedAt)", async () => {
    given();
    render(
      <SessionConsumptionChart
        chargePointId="cp-1"
        connectorId={1}
        startedAt={STARTED_AT}
        endedAt={null}
      />,
    );

    await waitFor(() => expect(api.Metering.getConsumption).toHaveBeenCalled());
    const [, query] = vi.mocked(api.Metering.getConsumption).mock.calls[0];
    expect(query!.to!.getTime()).toBeGreaterThan(STARTED_AT.getTime());
  });

  it("SHOULD explain the empty state WHEN the station reported nothing in the window", async () => {
    given({ seriesList: [], samples: [] });
    render(
      <SessionConsumptionChart
        chargePointId="cp-1"
        connectorId={1}
        startedAt={STARTED_AT}
        endedAt={ENDED_AT}
      />,
    );

    expect(
      await screen.findByText("appPage.chargePoints.chargingSessions.consumption.empty"),
    ).toBeDefined();
    expect(screen.queryByTestId("chart")).toBeNull();
  });

  it("SHOULD surface a load failure instead of rendering an empty chart", async () => {
    vi.mocked(api.Metering.getConsumption).mockRejectedValue(new Error("boom"));
    vi.mocked(api.Metering.getMeterSamples).mockResolvedValue([]);
    render(
      <SessionConsumptionChart
        chargePointId="cp-1"
        connectorId={1}
        startedAt={STARTED_AT}
        endedAt={ENDED_AT}
      />,
    );

    expect(
      await screen.findByText("appPage.chargePoints.chargingSessions.consumption.loadError"),
    ).toBeDefined();
    expect(screen.queryByTestId("chart")).toBeNull();
  });

  it("SHOULD show a tile for every measurand the connector reported, not just the plotted one", async () => {
    given({
      seriesList: [
        series({ measurand: "Energy.Active.Import.Register", unit: "Wh", min: 1000, max: 4000 }),
        series({ measurand: "Voltage", unit: "V", avg: 230, max: 235 }),
      ],
    });
    render(
      <SessionConsumptionChart
        chargePointId="cp-1"
        connectorId={1}
        startedAt={STARTED_AT}
        endedAt={ENDED_AT}
      />,
    );

    // Delivered = max - min for the cumulative register; average for the spot reading.
    expect(await screen.findByText("3,000 Wh")).toBeTruthy();
    expect(screen.getByText("230 V")).toBeTruthy();
  });

  it("SHOULD show the measurand selector WHEN the connector reported more than one", async () => {
    given({
      seriesList: [
        series({ measurand: "Energy.Active.Import.Register" }),
        series({ measurand: "Voltage", unit: "V" }),
      ],
    });
    render(
      <SessionConsumptionChart
        chargePointId="cp-1"
        connectorId={1}
        startedAt={STARTED_AT}
        endedAt={ENDED_AT}
      />,
    );

    expect(
      await screen.findByLabelText("appPage.chargePoints.consumption.measurandLabel"),
    ).toBeTruthy();
  });

  it("SHOULD NOT show the measurand selector WHEN the connector reported only one", async () => {
    given();
    render(
      <SessionConsumptionChart
        chargePointId="cp-1"
        connectorId={1}
        startedAt={STARTED_AT}
        endedAt={ENDED_AT}
      />,
    );

    await screen.findByTestId("chart");
    expect(
      screen.queryByLabelText("appPage.chargePoints.consumption.measurandLabel"),
    ).toBeNull();
  });
});

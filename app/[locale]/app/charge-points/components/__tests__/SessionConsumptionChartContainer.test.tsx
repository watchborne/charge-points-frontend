import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

// The presentational half is covered by SessionConsumptionChart.test.tsx —
// this suite only needs to know the container hands it the loaded data.
vi.mock("../SessionConsumptionChart", () => ({
  SessionConsumptionChart: ({ series, samples }: { series: unknown[]; samples: unknown[] }) => (
    <div data-testid="chart" data-series={series.length} data-samples={samples.length} />
  ),
}));

vi.mock("../../../../../../lib/api", () => ({
  api: {
    Metering: { getConsumption: vi.fn(), getMeterSamples: vi.fn() },
  },
}));

import { api } from "../../../../../../lib/api";
import { SessionConsumptionChartContainer } from "../SessionConsumptionChartContainer";

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

describe("SessionConsumptionChartContainer", () => {
  it("SHOULD scope the fetch to the session's connector and timeframe", async () => {
    given();
    render(
      <SessionConsumptionChartContainer
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

  it("SHOULD fetch up to now WHEN the session is still active (no endedAt)", async () => {
    given();
    render(
      <SessionConsumptionChartContainer
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

  it("SHOULD hand the loaded series and samples to the chart", async () => {
    given({
      seriesList: [series(), series({ measurand: "Voltage", unit: "V" })],
      samples: [sample(), sample({ id: crypto.randomUUID() })],
    });
    render(
      <SessionConsumptionChartContainer
        chargePointId="cp-1"
        connectorId={1}
        startedAt={STARTED_AT}
        endedAt={ENDED_AT}
      />,
    );

    const chart = await screen.findByTestId("chart");
    expect(chart.getAttribute("data-series")).toBe("2");
    expect(chart.getAttribute("data-samples")).toBe("2");
  });

  it("SHOULD hand an empty result to the chart WHEN the station reported nothing in the window", async () => {
    given({ seriesList: [], samples: [] });
    render(
      <SessionConsumptionChartContainer
        chargePointId="cp-1"
        connectorId={1}
        startedAt={STARTED_AT}
        endedAt={ENDED_AT}
      />,
    );

    const chart = await screen.findByTestId("chart");
    expect(chart.getAttribute("data-series")).toBe("0");
  });

  it("SHOULD surface a load failure instead of rendering an empty chart", async () => {
    vi.mocked(api.Metering.getConsumption).mockRejectedValue(new Error("boom"));
    vi.mocked(api.Metering.getMeterSamples).mockResolvedValue([]);
    render(
      <SessionConsumptionChartContainer
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

  it("SHOULD show a loading state WHILE fetching", () => {
    given();
    render(
      <SessionConsumptionChartContainer
        chargePointId="cp-1"
        connectorId={1}
        startedAt={STARTED_AT}
        endedAt={ENDED_AT}
      />,
    );

    expect(
      screen.getByText("appPage.chargePoints.chargingSessions.consumption.loading"),
    ).toBeDefined();
  });
});

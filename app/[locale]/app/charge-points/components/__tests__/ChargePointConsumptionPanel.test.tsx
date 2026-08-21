import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

// Recharts renders into a ResponsiveContainer that measures 0x0 under jsdom, so
// the SVG never appears. Stubbed to a marker carrying the props this panel is
// responsible for choosing — which connectors are charted, and in which unit.
vi.mock("../ConsumptionChart", () => ({
  CHARTABLE_CONNECTORS: 3,
  ConsumptionChart: ({
    connectorIds,
    unit,
    samples,
  }: {
    connectorIds: number[];
    unit?: string;
    samples: unknown[];
  }) => (
    <div
      data-testid="chart"
      data-connectors={connectorIds.join(",")}
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
import { ChargePointConsumptionPanel } from "../ChargePointConsumptionPanel";

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

const WINDOW = { from: "2026-08-09T12:00:00.000Z", to: "2026-08-10T12:00:00.000Z" };

const series = (overrides: Record<string, unknown> = {}) => ({
  connectorId: 1,
  measurand: "Energy.Active.Import.Register",
  unit: "Wh",
  min: 1000,
  max: 2620,
  avg: 1800,
  sampleCount: 24,
  firstMeasuredAt: WINDOW.from,
  lastMeasuredAt: WINDOW.to,
  ...overrides,
});

const sample = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  chargePointId: "cp-1",
  connectorId: 1,
  measuredAt: WINDOW.to,
  measurand: "Energy.Active.Import.Register",
  unit: "Wh",
  value: 2620,
  createdAt: WINDOW.to,
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
    ...WINDOW,
    series: seriesList,
  });
  vi.mocked(api.Metering.getMeterSamples).mockResolvedValue(samples);
};

describe("ChargePointConsumptionPanel", () => {
  it("SHOULD show energy delivered as max minus min WHEN the measurand is a cumulative register", async () => {
    given();
    render(<ChargePointConsumptionPanel chargePointId="cp-1" />);

    // 2620 - 1000, locale-formatted with its unit — not the raw register value.
    expect(await screen.findByText("1,620 Wh")).toBeDefined();
    // Title is combined with connector series label in a single <p> element, verify at least one exists
    const elements = screen.getAllByText(/appPage\.chargePoints\.consumption\.tiles\.delivered/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it("SHOULD show the average, not a difference, WHEN the measurand is a spot reading", async () => {
    given({
      seriesList: [
        series({ measurand: "Power.Active.Import", unit: "W", min: 0, max: 7400, avg: 6900 }),
      ],
      samples: [sample({ measurand: "Power.Active.Import", unit: "W", value: 7400 })],
    });
    render(<ChargePointConsumptionPanel chargePointId="cp-1" />);

    expect(await screen.findByText("6,900 W")).toBeDefined();
    expect(screen.getByText(/appPage\.chargePoints\.consumption\.tiles\.average/)).toBeDefined();
    expect(screen.getByText("appPage.chargePoints.consumption.tiles.peak")).toBeDefined();
  });

  it("SHOULD default to the energy register WHEN the station reports several measurands", async () => {
    given({
      seriesList: [
        series({ measurand: "Voltage", unit: "V" }),
        series({ measurand: "Energy.Active.Import.Register", unit: "Wh" }),
      ],
    });
    render(<ChargePointConsumptionPanel chargePointId="cp-1" />);

    await waitFor(() =>
      expect(api.Metering.getMeterSamples).toHaveBeenCalledWith(
        "cp-1",
        expect.objectContaining({ measurands: ["Energy.Active.Import.Register"] }),
      ),
    );
  });

  it("SHOULD ask for only the charted measurand, not every one the station reports", async () => {
    given({
      seriesList: [
        series({ measurand: "Energy.Active.Import.Register" }),
        series({ measurand: "Voltage", unit: "V" }),
        series({ measurand: "SoC", unit: "Percent" }),
      ],
    });
    render(<ChargePointConsumptionPanel chargePointId="cp-1" />);

    await waitFor(() => expect(api.Metering.getMeterSamples).toHaveBeenCalled());
    const { measurands } = vi.mocked(api.Metering.getMeterSamples).mock.calls[0][1] ?? {};
    expect(measurands).toHaveLength(1);
  });

  it("SHOULD chart every connector of the selected measurand, in ordinal order", async () => {
    given({
      seriesList: [series({ connectorId: 2 }), series({ connectorId: 1 })],
    });
    render(<ChargePointConsumptionPanel chargePointId="cp-1" />);

    const chart = await screen.findByTestId("chart");
    expect(chart.getAttribute("data-connectors")).toBe("1,2");
  });

  it("SHOULD cap the chart at three connectors AND say how many it left out", async () => {
    given({
      seriesList: [1, 2, 3, 4, 5].map((connectorId) => series({ connectorId })),
    });
    render(<ChargePointConsumptionPanel chargePointId="cp-1" />);

    const chart = await screen.findByTestId("chart");
    expect(chart.getAttribute("data-connectors")).toBe("1,2,3");
    expect(screen.getByText("appPage.chargePoints.consumption.connectorsOmitted")).toBeDefined();
  });

  it("SHOULD NOT claim omitted connectors WHEN every one is charted", async () => {
    given({ seriesList: [series({ connectorId: 1 })] });
    render(<ChargePointConsumptionPanel chargePointId="cp-1" />);

    await screen.findByTestId("chart");
    expect(screen.queryByText("appPage.chargePoints.consumption.connectorsOmitted")).toBeNull();
  });

  it("SHOULD tell the reader the window was truncated WHEN the sample cap was hit", async () => {
    given({ samples: Array.from({ length: 3_000 }, () => sample()) });
    render(<ChargePointConsumptionPanel chargePointId="cp-1" />);

    expect(await screen.findByText("appPage.chargePoints.consumption.truncated")).toBeDefined();
  });

  it("SHOULD NOT mention truncation WHEN the window fits under the cap", async () => {
    given();
    render(<ChargePointConsumptionPanel chargePointId="cp-1" />);

    await screen.findByTestId("chart");
    expect(screen.queryByText("appPage.chargePoints.consumption.truncated")).toBeNull();
  });

  it("SHOULD explain the empty state WHEN the station reported nothing in the window", async () => {
    given({ seriesList: [], samples: [] });
    render(<ChargePointConsumptionPanel chargePointId="cp-1" />);

    expect(await screen.findByText("appPage.chargePoints.consumption.empty")).toBeDefined();
    expect(screen.queryByTestId("chart")).toBeNull();
  });

  it("SHOULD surface a load failure instead of rendering an empty chart", async () => {
    vi.mocked(api.Metering.getConsumption).mockRejectedValue(new Error("boom"));
    vi.mocked(api.Metering.getMeterSamples).mockResolvedValue([]);
    render(<ChargePointConsumptionPanel chargePointId="cp-1" />);

    expect(await screen.findByText("errors.loadingConsumption")).toBeDefined();
    expect(screen.queryByTestId("chart")).toBeNull();
  });

  it("SHOULD pass the series unit to the chart so the axis is labelled", async () => {
    given();
    render(<ChargePointConsumptionPanel chargePointId="cp-1" />);

    expect((await screen.findByTestId("chart")).getAttribute("data-unit")).toBe("Wh");
  });

  it("SHOULD default to the 24h window", async () => {
    given();
    render(<ChargePointConsumptionPanel chargePointId="cp-1" />);

    await waitFor(() => expect(api.Metering.getConsumption).toHaveBeenCalled());
    const [, query] = vi.mocked(api.Metering.getConsumption).mock.calls[0];
    const hours = (query!.to!.getTime() - query!.from!.getTime()) / (60 * 60 * 1000);
    expect(hours).toBeCloseTo(24, 1);
  });
});

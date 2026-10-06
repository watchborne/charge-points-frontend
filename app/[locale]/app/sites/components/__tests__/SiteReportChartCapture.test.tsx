import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { captureChartImageMock, captureExceptionMock } = vi.hoisted(() => ({
  captureChartImageMock: vi.fn(),
  captureExceptionMock: vi.fn(),
}));

vi.mock("../../../../../../lib/capture-chart-image", () => ({
  captureChartImage: captureChartImageMock,
}));
vi.mock("@sentry/nextjs", () => ({ captureException: captureExceptionMock }));

// The real chart needs a layout engine and recharts' ResizeObserver; this
// component only needs a node to hand to `captureChartImage`.
vi.mock("../../../charge-points/components/ConsumptionChart", () => ({
  ConsumptionChart: () => null,
}));

import type { SiteReportChargePoint } from "../../../hooks/useSiteReport";
import { SiteReportChartCapture } from "../SiteReportChartCapture";

const chargePoint = (id: string, chartMeasurand: string | null = "Energy.Active.Import.Register") =>
  ({
    chargePointId: id,
    chartMeasurand,
    chartSamples: [],
    chartConnectorIds: [1],
    consumption: { series: [{ measurand: "Energy.Active.Import.Register", unit: "Wh" }] },
  }) as unknown as SiteReportChargePoint;

beforeEach(() => {
  vi.clearAllMocks();
  // Run the two paint frames synchronously so the tests don't wait on real ones.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SiteReportChartCapture", () => {
  it("SHOULD report every captured image, with no failures, WHEN all charts rasterize", async () => {
    captureChartImageMock.mockResolvedValue("data:image/png;base64,AAA");
    const onCaptured = vi.fn();

    render(
      <SiteReportChartCapture
        chargePoints={[chargePoint("cp-1"), chargePoint("cp-2")]}
        spansDays
        onCaptured={onCaptured}
      />,
    );

    await waitFor(() => expect(onCaptured).toHaveBeenCalledTimes(1));
    expect(onCaptured).toHaveBeenCalledWith(
      { "cp-1": "data:image/png;base64,AAA", "cp-2": "data:image/png;base64,AAA" },
      0,
    );
  });

  it("SHOULD still call onCaptured, keeping the other charts, WHEN one capture rejects (issue #454)", async () => {
    const failure = new Error("html2canvas: tainted canvas");
    captureChartImageMock
      .mockResolvedValueOnce("data:image/png;base64,OK")
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce("data:image/png;base64,OK2");
    const onCaptured = vi.fn();

    render(
      <SiteReportChartCapture
        chargePoints={[chargePoint("cp-1"), chargePoint("cp-2"), chargePoint("cp-3")]}
        spansDays
        onCaptured={onCaptured}
      />,
    );

    await waitFor(() => expect(onCaptured).toHaveBeenCalledTimes(1));
    expect(onCaptured).toHaveBeenCalledWith(
      { "cp-1": "data:image/png;base64,OK", "cp-3": "data:image/png;base64,OK2" },
      1,
    );
    expect(captureExceptionMock).toHaveBeenCalledWith(failure);
  });

  it("SHOULD still call onCaptured with no images WHEN every capture rejects", async () => {
    captureChartImageMock.mockRejectedValue(new Error("boom"));
    const onCaptured = vi.fn();

    render(
      <SiteReportChartCapture
        chargePoints={[chargePoint("cp-1"), chargePoint("cp-2")]}
        spansDays
        onCaptured={onCaptured}
      />,
    );

    await waitFor(() => expect(onCaptured).toHaveBeenCalledTimes(1));
    expect(onCaptured).toHaveBeenCalledWith({}, 2);
    expect(captureExceptionMock).toHaveBeenCalledTimes(2);
  });

  it("SHOULD call onCaptured once, without capturing anything, WHEN no charge point has a chartable measurand", async () => {
    const onCaptured = vi.fn();

    render(
      <SiteReportChartCapture
        chargePoints={[chargePoint("cp-1", null)]}
        spansDays={false}
        onCaptured={onCaptured}
      />,
    );

    await waitFor(() => expect(onCaptured).toHaveBeenCalledTimes(1));
    expect(onCaptured).toHaveBeenCalledWith({}, 0);
    expect(captureChartImageMock).not.toHaveBeenCalled();
  });

  it("SHOULD skip a charge point with no chartable measurand without counting it as a failure", async () => {
    captureChartImageMock.mockResolvedValue("data:image/png;base64,AAA");
    const onCaptured = vi.fn();

    render(
      <SiteReportChartCapture
        chargePoints={[chargePoint("cp-1"), chargePoint("cp-2", null)]}
        spansDays
        onCaptured={onCaptured}
      />,
    );

    await waitFor(() => expect(onCaptured).toHaveBeenCalledTimes(1));
    expect(onCaptured).toHaveBeenCalledWith({ "cp-1": "data:image/png;base64,AAA" }, 0);
  });
});

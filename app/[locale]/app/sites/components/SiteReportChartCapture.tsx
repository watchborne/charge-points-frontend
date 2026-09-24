"use client";

import { useEffect, useRef } from "react";

import { captureChartImage } from "@/lib/capture-chart-image";

import { ConsumptionChart } from "../../charge-points/components/ConsumptionChart";
import type { SiteReportChargePoint } from "../../hooks/useSiteReport";

type Props = {
  chargePoints: SiteReportChargePoint[];
  /** Whether the report's window spans more than a day — changes the chart's tick format, same as `ChargePointConsumptionPanel`'s own `range !== "24h"`. */
  spansDays: boolean;
  onCaptured: (chartImages: Record<string, string>) => void;
};

const waitForPaint = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Renders each charge point's consumption chart off-screen, using the exact
 * same `ConsumptionChart` the dashboard renders, then rasterizes each one to
 * a PNG (`captureChartImage`) for the PDF to embed. Positioned off-screen
 * rather than `display: none` — `recharts`' `ResponsiveContainer` measures
 * itself via `ResizeObserver`, which needs real layout to report a size.
 *
 * Fires `onCaptured` exactly once, after two animation frames: one for React
 * to commit the mount, one for the chart's initial ResizeObserver-driven
 * measurement to paint before the snapshot — a single frame occasionally
 * races it. A charge point with no charted measurand is skipped entirely
 * (no chart to capture).
 */
export const SiteReportChartCapture = ({ chargePoints, spansDays, onCaptured }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);

  const chartable = chargePoints.filter((cp) => cp.chartMeasurand !== null);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    if (chartable.length === 0) {
      onCaptured({});
      return;
    }

    const container = containerRef.current;
    if (!container) {
      onCaptured({});
      return;
    }

    void (async () => {
      await waitForPaint();
      await waitForPaint();

      const chartImages: Record<string, string> = {};
      for (const cp of chartable) {
        const node = container.querySelector<HTMLElement>(`[data-chart-cp="${cp.chargePointId}"]`);
        if (node) {
          chartImages[cp.chargePointId] = await captureChartImage(node);
        }
      }

      onCaptured(chartImages);
    })();
    // Fires exactly once per mount, guarded by firedRef — chartable/onCaptured are read from the initial render only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      style={{ position: "fixed", top: 0, left: -10_000, width: 640, pointerEvents: "none" }}
    >
      {chartable.map((cp) => (
        <div key={cp.chargePointId} data-chart-cp={cp.chargePointId} style={{ width: 640 }}>
          <ConsumptionChart
            samples={cp.chartSamples}
            connectorIds={cp.chartConnectorIds}
            measurand={cp.chartMeasurand ?? ""}
            unit={
              cp.consumption.series.find((series) => series.measurand === cp.chartMeasurand)?.unit
            }
            spansDays={spansDays}
          />
        </div>
      ))}
    </div>
  );
};

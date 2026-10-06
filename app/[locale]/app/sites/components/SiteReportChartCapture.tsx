"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useRef } from "react";

import { captureChartImage } from "@/lib/capture-chart-image";

import { ConsumptionChart } from "../../charge-points/components/ConsumptionChart";
import type { SiteReportChargePoint } from "../../hooks/useSiteReport";

type Props = {
  chargePoints: SiteReportChargePoint[];
  /** Whether the report's window spans more than a day — changes the chart's tick format, same as `ChargePointConsumptionPanel`'s own `range !== "24h"`. */
  spansDays: boolean;
  /**
   * Always called exactly once, whatever happens: `chartImages` holds every
   * chart that rasterized, `failedCount` how many of the expected charts did
   * not (a capture that threw, or a chart node that never rendered).
   */
  onCaptured: (chartImages: Record<string, string>, failedCount: number) => void;
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
 *
 * `captureChartImage` wraps `html2canvas`, which is known to throw (tainted
 * canvas, unsupported CSS, layout timing). A failure must never be the reason
 * `onCaptured` does not fire: the parent only leaves its "capturing" phase in
 * that callback, so a swallowed-nowhere rejection left the export button
 * spinning for ever (issue #454). Each chart is captured in its own `try`, so
 * one failing chart costs only itself; the rest still make it into the PDF, and
 * the failures are reported (Sentry) and counted for the caller to surface.
 */
export const SiteReportChartCapture = ({ chargePoints, spansDays, onCaptured }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);

  const chartable = chargePoints.filter((cp) => cp.chartMeasurand !== null);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    if (chartable.length === 0) {
      onCaptured({}, 0);
      return;
    }

    const container = containerRef.current;
    if (!container) {
      onCaptured({}, chartable.length);
      return;
    }

    void (async () => {
      const chartImages: Record<string, string> = {};

      try {
        await waitForPaint();
        await waitForPaint();

        for (const cp of chartable) {
          const node = container.querySelector<HTMLElement>(
            `[data-chart-cp="${cp.chargePointId}"]`,
          );
          if (!node) continue;

          try {
            chartImages[cp.chargePointId] = await captureChartImage(node);
          } catch (error) {
            Sentry.captureException(error);
          }
        }
      } catch (error) {
        Sentry.captureException(error);
      }

      // Outside the `try` on purpose: reached on every path above.
      onCaptured(chartImages, chartable.length - Object.keys(chartImages).length);
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

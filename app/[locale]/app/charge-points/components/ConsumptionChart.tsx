"use client";

import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MeterSample } from "@/lib/api-metering";

/**
 * The categorical slots, in fixed order, read from the CSS custom
 * properties in `app/globals.css` so light and dark each get their own
 * validated step without this component knowing which mode is active.
 *
 * Three, not more: overlaid lines can end up beside any other line, so the
 * palette must clear colour-blindness floors on every pair, and past three
 * hues no ordering does. `CHARTABLE_CONNECTORS` makes that cap explicit.
 */
const SERIES_VARS = ["var(--series-1)", "var(--series-2)", "var(--series-3)"] as const;
export const CHARTABLE_CONNECTORS = SERIES_VARS.length;

/** One x position with a value per charted connector, keyed by connector ordinal. */
type ChartRow = { measuredAt: number } & Record<string, number | undefined>;

const connectorKey = (connectorId: number) => `c${connectorId}`;

/**
 * Pivots the flat sample list into one row per timestamp, one column per
 * connector.
 *
 * Connectors on one station sample on the same timer but not necessarily the
 * same instant, so a row can legitimately hold one connector's value and not
 * another's. Those gaps stay `undefined`, not 0 — `connectNulls` bridges the
 * line instead of drawing a drop to zero the meter never read.
 */
const toChartRows = (samples: MeterSample[], connectorIds: number[]): ChartRow[] => {
  const rows = new Map<number, ChartRow>();

  for (const sample of samples) {
    if (!connectorIds.includes(sample.connectorId)) continue;

    const at = new Date(sample.measuredAt).getTime();
    const row = rows.get(at) ?? { measuredAt: at };
    row[connectorKey(sample.connectorId)] = sample.value;
    rows.set(at, row);
  }

  return Array.from(rows.values()).sort((a, b) => a.measuredAt - b.measuredAt);
};

type Props = {
  samples: MeterSample[];
  /** Connector ordinals to chart, in the order they take series slots. */
  connectorIds: number[];
  measurand: string;
  unit?: string;
  /** Spans more than a day, which changes the tick format from a time to a date. */
  spansDays: boolean;
};

/**
 * One measurand's readings over time, one line per connector.
 *
 * Deliberately single-measurand: energy in Wh and power in W don't share a
 * scale, and a second y-axis to fit both would have an arbitrary alignment
 * — inventing a correlation the data doesn't contain. The panel's measurand
 * selector keeps this to one unit; the caption above the plot names it.
 */
export const ConsumptionChart = ({ samples, connectorIds, measurand, unit, spansDays }: Props) => {
  const t = useTranslations("");
  const locale = useLocale();

  const rows = useMemo(() => toChartRows(samples, connectorIds), [samples, connectorIds]);

  const formatValue = useMemo(() => {
    const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    return (value: number) => formatter.format(value);
  }, [locale]);

  const formatTick = (at: number) => format(new Date(at), spansDays ? "dd/MM" : "HH:mm");

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("appPage.chargePoints.consumption.noSamples")}
      </p>
    );
  }

  const single = connectorIds.length === 1;

  return (
    // The plot is an SVG a screen reader can't narrate, so the region
    // carries the name (measurand + unit); the panel's table view carries the values.
    <div
      role="img"
      aria-label={t("appPage.chargePoints.consumption.chartLabel", {
        measurand,
        unit: unit ?? "",
      })}
    >
      {/* What's plotted, in HTML rather than an SVG axis label: an in-plot
          unit label would collide with the topmost y tick. Also names the
          series, so a single-series chart needs no legend. */}
      <p className="mb-1 text-[11px] text-muted-foreground">
        {measurand}
        {unit ? ` · ${unit}` : ""}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          {/* Horizontal only, solid hairline: vertical rules would compete
            with the crosshair, and a dashed grid reads as noise. */}
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeWidth={1} />
          <XAxis
            dataKey="measuredAt"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatTick}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            stroke="hsl(var(--border))"
            minTickGap={32}
          />
          <YAxis
            tickFormatter={formatValue}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            stroke="hsl(var(--border))"
            width={64}
          />
          <Tooltip
            // The crosshair finds the x: the reader aims at a moment, not a
            // 2px line, and the readout lists every connector at that moment.
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;

              return (
                <div className="rounded-md border bg-popover px-3 py-2 shadow-card">
                  <p className="mb-1 text-[11px] text-muted-foreground">
                    {format(new Date(label as number), "dd/MM/yyyy HH:mm:ss")}
                  </p>
                  {payload.map((entry) => (
                    <p
                      key={entry.dataKey as string}
                      className="flex items-center gap-2 text-xs text-popover-foreground"
                    >
                      {/* A short stroke keys the series; the text stays in
                        an ink token, so identity never rides on colour. */}
                      <span
                        aria-hidden
                        className="inline-block h-0.5 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      {/* Value leads, label follows: the reader already has
                        the series and wants the number. */}
                      <span className="font-medium">
                        {formatValue(entry.value as number)}
                        {unit ? ` ${unit}` : ""}
                      </span>
                      <span className="text-muted-foreground">{entry.name}</span>
                    </p>
                  ))}
                </div>
              );
            }}
          />
          {/* No legend box for a single series — the panel heading already names it. */}
          {!single && (
            <Legend
              verticalAlign="top"
              align="left"
              height={28}
              iconType="plainline"
              wrapperStyle={{ fontSize: 11 }}
              // Recharts paints legend text in the series colour by
              // default; the label wears an ink token instead — the line
              // key beside it carries identity, not the coloured text.
              formatter={(value) => <span className="text-muted-foreground">{String(value)}</span>}
            />
          )}
          {connectorIds.map((connectorId, index) => {
            const color = SERIES_VARS[index];
            const name = t("appPage.chargePoints.consumption.connectorSeries", { connectorId });

            return single ? (
              <Area
                key={connectorId}
                dataKey={connectorKey(connectorId)}
                name={name}
                type="monotone"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={color}
                fillOpacity={0.12}
                // No dot per reading — a dense series would become a solid
                // band. The active dot's 2px surface ring reads as lifted.
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                connectNulls
                isAnimationActive={false}
              />
            ) : (
              <Line
                key={connectorId}
                dataKey={connectorKey(connectorId)}
                name={name}
                type="monotone"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                connectNulls
                isAnimationActive={false}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

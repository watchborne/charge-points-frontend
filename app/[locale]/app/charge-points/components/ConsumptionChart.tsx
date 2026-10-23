"use client";

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
import { useDateFormat } from "@/lib/date-format";
import { formatUnit } from "@/lib/format-unit";

/**
 * The categorical slots, read from `app/globals.css` so each mode gets its own
 * validated colour. Three at most: past three hues no ordering clears the
 * colour-blindness floors on every pair (see `CHARTABLE_CONNECTORS`).
 */
const SERIES_VARS = ["var(--series-1)", "var(--series-2)", "var(--series-3)"] as const;
export const CHARTABLE_CONNECTORS = SERIES_VARS.length;

/** One x position with a value per charted connector, keyed by connector ordinal. */
type ChartRow = { measuredAt: number } & Record<string, number | undefined>;

const connectorKey = (connectorId: number) => `c${connectorId}`;

/**
 * One row per timestamp, one column per connector. Connectors don't sample at
 * the same instant, so gaps stay `undefined`, not 0: `connectNulls` bridges
 * them instead of drawing a drop to zero.
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
 * One measurand's readings over time, one line per connector. Single
 * measurand: Wh and W don't share a scale, and a second y-axis would invent a
 * correlation.
 */
export const ConsumptionChart = ({ samples, connectorIds, measurand, unit, spansDays }: Props) => {
  const t = useTranslations("");
  const { formatDateTime, formatDayMonth, formatTime } = useDateFormat();
  const locale = useLocale();

  const rows = useMemo(() => toChartRows(samples, connectorIds), [samples, connectorIds]);

  const formatValue = useMemo(() => {
    const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    return (value: number) => formatter.format(value);
  }, [locale]);

  const formatTick = (at: number) => (spansDays ? formatDayMonth(at) : formatTime(at));

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("appPage.chargePoints.consumption.noSamples")}
      </p>
    );
  }

  const single = connectorIds.length === 1;

  return (
    // A screen reader can't narrate the SVG: the region carries the name, the
    // table view the values.
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
        {unit ? ` · ${formatUnit(unit)}` : ""}
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
            // The readout lists every connector at the hovered x.
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;

              return (
                <div className="rounded-md border bg-popover px-3 py-2 shadow-card">
                  <p className="mb-1 text-[11px] text-muted-foreground">
                    {formatDateTime(label as number, { withSeconds: true })}
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
                        {unit ? ` ${formatUnit(unit)}` : ""}
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

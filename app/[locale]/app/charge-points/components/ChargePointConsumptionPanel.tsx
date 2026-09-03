"use client";

import {
  Button,
  Callout,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@watchborne/electrons";
import { format } from "date-fns";
import { BarChart3, Gauge, TableIcon, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  isCumulativeRegister,
  type ChargePointConsumption,
  type MeterSample,
  type MeterSampleSummary,
} from "@/lib/api-metering";

import { CHARTABLE_CONNECTORS, ConsumptionChart } from "./ConsumptionChart";
import {
  CONSUMPTION_RANGES,
  MAX_CHART_SAMPLES,
  type ConsumptionRange,
} from "../../hooks/useConsumption";

/**
 * A headline metering figure. Local rather than `StatCard` from
 * `@watchborne/electrons`: that primitive types `value` as a `number` and
 * prints it raw, but every figure here needs a locale-formatted number
 * *with its unit* ("1 620 Wh", not "1620") — same visual language, one slot
 * the shared component lacks.
 */
const ConsumptionTile = ({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) => (
  <div className="flex flex-col rounded-lg border bg-card p-3">
    <div className="mb-1 flex items-center justify-between gap-2">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {icon}
    </div>
    <p className="text-lg font-bold text-foreground">{value}</p>
    <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
  </div>
);

type Props = {
  range: ConsumptionRange;
  onRangeChange: (range: ConsumptionRange) => void;
  measurand: string | undefined;
  onMeasurandChange: (measurand: string) => void;
  consumption: ChargePointConsumption | null;
  samples: MeterSample[];
  measurands: string[];
  measurandLabels: Record<string, string>;
  truncated: boolean;
};

/**
 * A charge point's consumption: the window reduced to headline figures, and
 * the readings behind them plotted over time.
 *
 * One measurand at a time, on purpose — Wh and W don't share a scale, and
 * drawing both needs a second y-axis whose alignment is arbitrary, inventing
 * a correlation the meter never reported. The selector is built from what
 * the station actually reported in the window (the summary read), never a
 * hardcoded OCPP vocabulary, so a station with only an energy register shows exactly one option.
 *
 * Purely presentational — `ChargePointConsumptionPanelContainer` owns the
 * range/measurand selection and the fetch behind it, and renders its own
 * loading/error state in place of this component, so the marketing site's
 * product preview can render this directly with static data instead of
 * duplicating the markup. `view` (chart vs. table) stays local: it never
 * affects what's fetched, only how the same data is displayed.
 */
export const ChargePointConsumptionPanel = ({
  range,
  onRangeChange,
  measurand,
  onMeasurandChange,
  consumption,
  samples,
  measurands,
  measurandLabels,
  truncated,
}: Props) => {
  const t = useTranslations("");
  const locale = useLocale();

  const [view, setView] = useState<"chart" | "table">("chart");

  const formatNumber = useMemo(() => {
    const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    return (value: number) => formatter.format(value);
  }, [locale]);

  const selectedSeries = useMemo(
    () =>
      (consumption?.series ?? [])
        .filter((series) => series.measurand === measurand)
        .sort((a, b) => a.connectorId - b.connectorId),
    [consumption, measurand],
  );

  const chartedSeries = selectedSeries.slice(0, CHARTABLE_CONNECTORS);
  const omittedConnectors = selectedSeries.length - chartedSeries.length;
  const unit = chartedSeries[0]?.unit;

  const withUnit = (value: number, seriesUnit?: string) =>
    seriesUnit ? `${formatNumber(value)} ${seriesUnit}` : formatNumber(value);

  /**
   * The one figure that leads for a series. A cumulative register only
   * counts up, so `max - min` is what it delivered over the window — the
   * number an installer actually wants. Every other measurand is a spot
   * reading, where a difference between instants means nothing and the
   * average is the honest headline. The tile names which one it's showing,
   * rather than labelling both "consumption".
   */
  const headline = (series: MeterSampleSummary) =>
    isCumulativeRegister(series.measurand)
      ? {
          title: t("appPage.chargePoints.consumption.tiles.delivered"),
          value: withUnit(series.max - series.min, series.unit),
          subtitle: t("appPage.chargePoints.consumption.tiles.deliveredRange", {
            from: formatNumber(series.min),
            to: formatNumber(series.max),
          }),
          icon: <Zap className="h-3.5 w-3.5 text-muted-foreground" />,
        }
      : {
          title: t("appPage.chargePoints.consumption.tiles.average"),
          value: withUnit(series.avg, series.unit),
          subtitle: t("appPage.chargePoints.consumption.tiles.peak", {
            value: withUnit(series.max, series.unit),
          }),
          icon: <Gauge className="h-3.5 w-3.5 text-muted-foreground" />,
        };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{t("appPage.chargePoints.consumption.title")}</h4>

        {/* Filters in one row above the chart: window, then measurand, then view. */}
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            value={range}
            onValueChange={(value) => onRangeChange(value as ConsumptionRange)}
            className="overflow-auto"
          >
            <TabsList>
              {CONSUMPTION_RANGES.map((option) => (
                <TabsTrigger key={option} value={option} className="text-xs">
                  {t(`appPage.chargePoints.consumption.ranges.${option}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {measurands.length > 1 && measurand && (
            <Select value={measurand} onValueChange={onMeasurandChange}>
              <SelectTrigger
                className="h-8 w-[210px] text-xs"
                aria-label={t("appPage.chargePoints.consumption.measurandLabel")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {measurands.map((option) => (
                  <SelectItem key={option} value={option} className="text-xs">
                    {measurandLabels[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Not a nicety: how every value stays reachable without
              hovering, and the relief the palette's third slot needs
              (below 3:1 contrast on the light surface). */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(view === "chart" ? "table" : "chart")}
            aria-label={t(
              view === "chart"
                ? "appPage.chargePoints.consumption.showTable"
                : "appPage.chargePoints.consumption.showChart",
            )}
          >
            {view === "chart" ? (
              <TableIcon className="h-3.5 w-3.5" />
            ) : (
              <BarChart3 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {selectedSeries.length === 0 && (
        <Callout description={t("appPage.chargePoints.consumption.empty")} variant="info" />
      )}

      {selectedSeries.length > 0 && measurand && (
        <>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {chartedSeries.map((series) => {
              const { title, value, subtitle, icon } = headline(series);

              return (
                <ConsumptionTile
                  key={`${series.connectorId}-${series.measurand}-${series.unit ?? ""}`}
                  title={`${title} · ${t("appPage.chargePoints.consumption.connectorSeries", {
                    connectorId: series.connectorId,
                  })}`}
                  value={value}
                  subtitle={subtitle}
                  icon={icon}
                />
              );
            })}
          </div>

          {view === "chart" ? (
            <ConsumptionChart
              samples={samples}
              connectorIds={chartedSeries.map((series) => series.connectorId)}
              measurand={measurand}
              unit={unit}
              spansDays={range !== "24h"}
            />
          ) : (
            <div className="max-h-[260px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">
                      {t("appPage.chargePoints.consumption.table.measuredAt")}
                    </TableHead>
                    <TableHead className="text-xs">
                      {t("appPage.chargePoints.consumption.table.connector")}
                    </TableHead>
                    <TableHead className="text-right text-xs">
                      {t("appPage.chargePoints.consumption.table.value")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Newest first, the opposite of the chart's axis: a list
                      reads from the top, and the latest reading is the interesting one. */}
                  {[...samples].reverse().map((sample) => (
                    <TableRow key={sample.id}>
                      <TableCell className="text-xs">
                        {format(new Date(sample.measuredAt), "dd/MM/yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell className="text-xs">{sample.connectorId}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {withUnit(sample.value, sample.unit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Never silently drop data: both caps say what they left out. */}
          {omittedConnectors > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {t("appPage.chargePoints.consumption.connectorsOmitted", {
                count: omittedConnectors,
                charted: CHARTABLE_CONNECTORS,
              })}
            </p>
          )}
          {truncated && (
            <p className="text-[11px] text-muted-foreground">
              {t("appPage.chargePoints.consumption.truncated", { limit: MAX_CHART_SAMPLES })}
            </p>
          )}
        </>
      )}
    </div>
  );
};

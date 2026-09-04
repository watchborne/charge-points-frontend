import { Gauge, Zap } from "lucide-react";
import type { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { isCumulativeRegister, type MeterSampleSummary } from "@/lib/api-metering";

/** next-intl's own translator type, not a hand-rolled shape — its `values`
 * parameter is narrower than `Record<string, unknown>` (only
 * `string | number | Date`), so a looser signature here fails to accept the
 * real `t` under strict function-parameter checking. */
type Translate = ReturnType<typeof useTranslations>;

/**
 * A headline metering figure. Local rather than `StatCard` from
 * `@watchborne/electrons`: that primitive types `value` as a `number` and
 * prints it raw, but every figure here needs a locale-formatted number
 * *with its unit* ("1 620 Wh", not "1620") — same visual language, one slot
 * the shared component lacks.
 */
export const ConsumptionTile = ({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
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

export type ConsumptionHeadline = {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
};

/**
 * The one figure that leads for a series. A cumulative register only counts
 * up, so `max - min` is what it delivered over the window — the number an
 * installer actually wants. Every other measurand is a spot reading, where a
 * difference between instants means nothing and the average is the honest
 * headline. The tile names which one it's showing, rather than labelling
 * both "consumption".
 *
 * Shared between `ChargePointConsumptionPanel` (one tile per charted
 * connector, for the selected measurand) and `SessionConsumptionChart` (one
 * tile per measurand the session's connector reported) — both need the exact
 * same delivered-vs-average distinction, just sliced along a different axis.
 */
export const consumptionHeadline = (
  series: MeterSampleSummary,
  t: Translate,
  formatNumber: (value: number) => string,
): ConsumptionHeadline => {
  const withUnit = (value: number, unit?: string) =>
    unit ? `${formatNumber(value)} ${unit}` : formatNumber(value);

  return isCumulativeRegister(series.measurand)
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
};

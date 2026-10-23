import { Gauge, Zap } from "lucide-react";
import type { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { isCumulativeRegister, type MeterSampleSummary } from "@/lib/api-metering";
import { formatUnit } from "@/lib/format-unit";

/** next-intl's translator type: its `values` parameter is narrower than
 * `Record<string, unknown>`, so a looser signature rejects the real `t`. */
type Translate = ReturnType<typeof useTranslations>;

/**
 * A headline metering figure. Not electrons' `StatCard`, which prints a raw
 * number: these need a locale-formatted number with its unit.
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
 * The leading figure for a series: what a cumulative register delivered over
 * the window (`max - min`), else the average of a spot reading. The tile names
 * which. Used per connector by `ChargePointConsumptionPanel` and per measurand
 * by `SessionConsumptionChart`.
 */
export const consumptionHeadline = (
  series: MeterSampleSummary,
  t: Translate,
  formatNumber: (value: number) => string,
): ConsumptionHeadline => {
  const withUnit = (value: number, unit?: string) =>
    unit ? `${formatNumber(value)} ${formatUnit(unit)}` : formatNumber(value);

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

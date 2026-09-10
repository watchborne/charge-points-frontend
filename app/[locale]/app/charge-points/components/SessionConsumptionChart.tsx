"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  isCumulativeRegister,
  type MeterSample,
  type MeterSampleSummary,
} from "@/lib/api-metering";

import { ConsumptionChart } from "./ConsumptionChart";
import { consumptionHeadline, ConsumptionTile } from "./ConsumptionTile";

type Props = {
  connectorId: number;
  startedAt: Date | string;
  endedAt: Date | string | null;
  /** Every measurand the session's connector reported. */
  series: MeterSampleSummary[];
  /** The raw samples behind all of them — unfiltered, since the measurand
   * selector below switches which slice plots without needing new data. */
  samples: MeterSample[];
};

/**
 * One charging session's meter readings: a tile per measurand the session's
 * connector reported (same delivered-vs-average distinction
 * `ChargePointConsumptionPanel` draws for the tab), a measurand selector
 * when there's more than one, and the selected measurand plotted with the
 * same `ConsumptionChart` the tab uses — scoped to that session's own
 * connector and timeframe (`endedAt ?? now` for a still-active session)
 * rather than the tab's rolling 24h/7d/30d windows.
 *
 * Defaults the selector to the cumulative energy register when the station
 * reported one (the figure an installer actually wants for "how much did
 * this session deliver"), falling back to whichever measurand sorts first
 * otherwise — same precedence `ChargePointConsumptionPanelContainer` uses
 * for the tab.
 *
 * Purely presentational — `SessionConsumptionChartContainer` owns the fetch
 * and renders its own loading/error state in place of this component, so
 * `series`/`samples` here are always the loaded result; the marketing
 * site's product preview can render this directly with static fixture data
 * instead of duplicating the markup.
 */
export const SessionConsumptionChart = ({
  connectorId,
  startedAt,
  endedAt,
  series,
  samples,
}: Props) => {
  const t = useTranslations("");
  const locale = useLocale();

  const [selectedMeasurand, setSelectedMeasurand] = useState<string | undefined>(undefined);

  const formatNumber = useMemo(() => {
    const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    return (value: number) => formatter.format(value);
  }, [locale]);

  const measurands = useMemo(() => series.map((entry) => entry.measurand), [series]);

  const measurandLabel = (measurand: string) =>
    t(`appPage.chargePoints.consumption.measurands.${measurand.replaceAll(".", "")}`) ?? measurand;

  // The station decides which measurands exist, so selection follows the
  // data — same precedence ChargePointConsumptionPanelContainer uses for
  // the tab: default to the energy register, fall back to alphabetically
  // first. Re-runs whenever a fresh load changes what's available.
  useEffect(() => {
    if (measurands.length === 0) return;
    if (selectedMeasurand && measurands.includes(selectedMeasurand)) return;

    setSelectedMeasurand(measurands.find(isCumulativeRegister) ?? measurands[0]);
  }, [measurands, selectedMeasurand]);

  if (series.length === 0) {
    return (
      <p className="p-3 text-xs text-muted-foreground">
        {t("appPage.chargePoints.chargingSessions.consumption.empty")}
      </p>
    );
  }

  if (!selectedMeasurand) return null;

  const chartSamples = samples
    .filter((sample) => sample.measurand === selectedMeasurand)
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
  const chartUnit = series.find((entry) => entry.measurand === selectedMeasurand)?.unit;
  const spansDays =
    (endedAt ? new Date(endedAt) : new Date()).getTime() - new Date(startedAt).getTime() >
    86_400_000;

  return (
    <div className="flex flex-col gap-3 p-3">
      {measurands.length > 1 && (
        <div className="flex justify-end">
          <Select value={selectedMeasurand} onValueChange={setSelectedMeasurand}>
            <SelectTrigger
              className="h-8 w-[210px] text-xs"
              aria-label={t("appPage.chargePoints.consumption.measurandLabel")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {measurands.map((option) => (
                <SelectItem key={option} value={option} className="text-xs">
                  {measurandLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {series.map((entry) => {
          const { title, value, subtitle, icon } = consumptionHeadline(entry, t, formatNumber);

          return (
            <ConsumptionTile
              key={`${entry.measurand}-${entry.unit ?? ""}`}
              title={`${title} · ${measurandLabel(entry.measurand)}`}
              value={value}
              subtitle={subtitle}
              icon={icon}
            />
          );
        })}
      </div>

      <ConsumptionChart
        samples={chartSamples}
        connectorIds={[connectorId]}
        measurand={selectedMeasurand}
        unit={chartUnit}
        spansDays={spansDays}
      />
    </div>
  );
};

"use client";

import { Callout } from "@watchborne/electrons";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import {
  isCumulativeRegister,
  type MeterSample,
  type MeterSampleSummary,
} from "@/lib/api-metering";
import type { ChargePoint } from "@/types/charge-point";

import { ConsumptionChart } from "./ConsumptionChart";
import { consumptionHeadline, ConsumptionTile } from "./ConsumptionTile";

/** Row cap for one session's raw series read — a session rarely spans more
 * than a few hours, so this is far above what a real session ever reports;
 * it only guards against a pathologically long-running one. */
const MAX_SESSION_CHART_SAMPLES = 3_000;

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "empty" }
  /** Every measurand the session's connector reported, plus the raw samples
   * behind all of them — unfiltered, since the measurand selector below
   * switches which slice of `samples` the chart plots without a re-fetch. */
  | { status: "loaded"; series: MeterSampleSummary[]; samples: MeterSample[] };

type Props = {
  chargePointId: ChargePoint["id"];
  connectorId: number;
  startedAt: Date | string;
  endedAt: Date | string | null;
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
 */
export const SessionConsumptionChart = ({
  chargePointId,
  connectorId,
  startedAt,
  endedAt,
}: Props) => {
  const t = useTranslations("");
  const locale = useLocale();

  const [state, setState] = useState<State>({ status: "loading" });
  const [selectedMeasurand, setSelectedMeasurand] = useState<string | undefined>(undefined);

  const formatNumber = useMemo(() => {
    const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    return (value: number) => formatter.format(value);
  }, [locale]);

  useEffect(() => {
    let cancelled = false;

    const from = new Date(startedAt);
    const to = endedAt ? new Date(endedAt) : new Date();

    (async () => {
      setState({ status: "loading" });

      try {
        const [summary, rows] = await Promise.all([
          api.Metering.getConsumption(chargePointId, { connectorId, from, to }),
          api.Metering.getMeterSamples(chargePointId, {
            connectorId,
            from,
            to,
            limit: MAX_SESSION_CHART_SAMPLES,
          }),
        ]);

        if (cancelled) return;

        if (summary.series.length === 0) {
          setState({ status: "empty" });
          return;
        }

        setState({ status: "loaded", series: summary.series, samples: rows });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chargePointId, connectorId, startedAt, endedAt]);

  const measurands = useMemo(
    () => (state.status === "loaded" ? state.series.map((series) => series.measurand) : []),
    [state],
  );

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

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("appPage.chargePoints.chargingSessions.consumption.loading")}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="p-3">
        <Callout
          description={t("appPage.chargePoints.chargingSessions.consumption.loadError")}
          variant="error"
        />
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <p className="p-3 text-xs text-muted-foreground">
        {t("appPage.chargePoints.chargingSessions.consumption.empty")}
      </p>
    );
  }

  if (!selectedMeasurand) return null;

  const chartSamples = state.samples
    .filter((sample) => sample.measurand === selectedMeasurand)
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
  const chartUnit = state.series.find((series) => series.measurand === selectedMeasurand)?.unit;
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
        {state.series.map((series) => {
          const { title, value, subtitle, icon } = consumptionHeadline(series, t, formatNumber);

          return (
            <ConsumptionTile
              key={`${series.measurand}-${series.unit ?? ""}`}
              title={`${title} · ${measurandLabel(series.measurand)}`}
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

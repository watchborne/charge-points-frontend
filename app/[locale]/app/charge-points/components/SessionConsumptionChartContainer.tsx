"use client";

import { Callout } from "@watchborne/electrons";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { MeterSample, MeterSampleSummary } from "@/lib/api-metering";
import type { ChargePoint } from "@/types/charge-point";

import { SessionConsumptionChart } from "./SessionConsumptionChart";

/** Row cap for one session's raw series read — a session rarely spans more
 * than a few hours, so this is far above what a real session ever reports;
 * it only guards against a pathologically long-running one. */
const MAX_SESSION_CHART_SAMPLES = 3_000;

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; series: MeterSampleSummary[]; samples: MeterSample[] };

type Props = {
  chargePointId: ChargePoint["id"];
  connectorId: number;
  startedAt: Date | string;
  endedAt: Date | string | null;
};

/**
 * Fetches one charging session's meter readings and hands them to
 * `SessionConsumptionChart` — the data-owning half of that
 * container/presentational split, same shape as
 * `ChargePointConsumptionPanelContainer`/`ChargePointConsumptionPanel`. Also
 * owns the loading/error templates, so `SessionConsumptionChart` only ever
 * renders the loaded result — an empty result (the station reported nothing
 * in the window) is not an error, so that state stays in the presentational
 * component alongside every other empty-state check in this file's siblings.
 */
export const SessionConsumptionChartContainer = ({
  chargePointId,
  connectorId,
  startedAt,
  endedAt,
}: Props) => {
  const t = useTranslations("");

  const [state, setState] = useState<State>({ status: "loading" });

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

        setState({ status: "loaded", series: summary.series, samples: rows });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chargePointId, connectorId, startedAt, endedAt]);

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

  return (
    <SessionConsumptionChart
      connectorId={connectorId}
      startedAt={startedAt}
      endedAt={endedAt}
      series={state.series}
      samples={state.samples}
    />
  );
};

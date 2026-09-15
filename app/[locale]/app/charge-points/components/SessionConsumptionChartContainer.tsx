"use client";

import { useQuery } from "@tanstack/react-query";
import { Callout } from "@watchborne/electrons";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";

import { SessionConsumptionChart } from "./SessionConsumptionChart";

/** Row cap for one session's raw series read — a session rarely spans more
 * than a few hours, so this is far above what a real session ever reports;
 * it only guards against a pathologically long-running one. */
const MAX_SESSION_CHART_SAMPLES = 3_000;

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

  const startedAtIso = new Date(startedAt).toISOString();
  const endedAtIso = endedAt ? new Date(endedAt).toISOString() : null;

  const {
    data,
    isLoading: loading,
    isError: failed,
  } = useQuery({
    queryKey: queryKeys.consumption.session(chargePointId, connectorId, startedAtIso, endedAtIso),
    queryFn: async () => {
      const from = new Date(startedAtIso);
      const to = endedAtIso ? new Date(endedAtIso) : new Date();

      const [summary, rows] = await Promise.all([
        api.Metering.getConsumption(chargePointId, { connectorId, from, to }),
        api.Metering.getMeterSamples(chargePointId, {
          connectorId,
          from,
          to,
          limit: MAX_SESSION_CHART_SAMPLES,
        }),
      ]);

      return { series: summary.series, samples: rows };
    },
  });

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("appPage.chargePoints.chargingSessions.consumption.loading")}
      </div>
    );
  }

  if (failed || !data) {
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
      series={data.series}
      samples={data.samples}
    />
  );
};

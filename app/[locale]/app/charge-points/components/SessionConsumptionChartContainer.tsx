"use client";

import { useQuery } from "@tanstack/react-query";
import { Callout } from "@watchborne/electrons";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";

import { SessionConsumptionChart } from "./SessionConsumptionChart";

/** Row cap for one session's read; only a pathological session reaches it. */
const MAX_SESSION_CHART_SAMPLES = 3_000;

type Props = {
  chargePointId: ChargePoint["id"];
  connectorId: number;
  startedAt: Date | string;
  endedAt: Date | string | null;
};

/**
 * Fetches one session's readings for `SessionConsumptionChart` and owns the
 * loading/error states. An empty result is not an error and is handled by the
 * chart.
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

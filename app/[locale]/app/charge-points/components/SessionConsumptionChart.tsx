"use client";

import { Callout } from "@watchborne/electrons";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { isCumulativeRegister, type MeterSample } from "@/lib/api-metering";
import type { ChargePoint } from "@/types/charge-point";

import { ConsumptionChart } from "./ConsumptionChart";

/** Row cap for one session's raw series read — a session rarely spans more
 * than a few hours, so this is far above what a real session ever reports;
 * it only guards against a pathologically long-running one. */
const MAX_SESSION_CHART_SAMPLES = 3_000;

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "empty" }
  | { status: "loaded"; samples: MeterSample[]; measurand: string; unit?: string };

type Props = {
  chargePointId: ChargePoint["id"];
  connectorId: number;
  startedAt: Date | string;
  endedAt: Date | string | null;
};

/**
 * One charging session's meter readings, plotted with the same
 * `ConsumptionChart` the consumption tab uses — scoped to that session's own
 * connector and timeframe (`endedAt ?? now` for a still-active session)
 * rather than the tab's rolling 24h/7d/30d windows.
 *
 * Defaults to the cumulative energy register when the station reported one
 * (the figure an installer actually wants for "how much did this session
 * deliver"), falling back to whichever measurand sorts first otherwise —
 * same precedence `ChargePointConsumptionPanelContainer` uses for the tab.
 */
export const SessionConsumptionChart = ({
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

        const measurands = Array.from(new Set(summary.series.map((series) => series.measurand)));
        const measurand = measurands.find(isCumulativeRegister) ?? measurands[0];

        if (!measurand) {
          setState({ status: "empty" });
          return;
        }

        const samples = rows
          .filter((sample) => sample.measurand === measurand)
          .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());

        setState({ status: "loaded", samples, measurand, unit: samples[0]?.unit });
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

  if (state.status === "empty") {
    return (
      <p className="p-3 text-xs text-muted-foreground">
        {t("appPage.chargePoints.chargingSessions.consumption.empty")}
      </p>
    );
  }

  const spansDays =
    (endedAt ? new Date(endedAt) : new Date()).getTime() - new Date(startedAt).getTime() >
    86_400_000;

  return (
    <div className="p-3">
      <ConsumptionChart
        samples={state.samples}
        connectorIds={[connectorId]}
        measurand={state.measurand}
        unit={state.unit}
        spansDays={spansDays}
      />
    </div>
  );
};

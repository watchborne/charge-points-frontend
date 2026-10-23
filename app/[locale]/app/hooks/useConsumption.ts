import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { api } from "@/lib/api";
import type { ChargePointConsumption, MeterSample } from "@/lib/api-metering";
import { queryKeys } from "@/lib/queryKeys";

/** The windows the panel offers: fixed, not a free date picker. */
export const CONSUMPTION_RANGES = ["24h", "7d", "30d"] as const;
export type ConsumptionRange = (typeof CONSUMPTION_RANGES)[number];

const RANGE_HOURS: Record<ConsumptionRange, number> = { "24h": 24, "7d": 24 * 7, "30d": 24 * 30 };

/**
 * Row cap for the raw read (the backend allows 10 000): a 30-day window at
 * 60s holds ~43 000 readings, far more than a chart can draw. The read
 * returns the newest rows, and the panel says when it was truncated.
 */
export const MAX_CHART_SAMPLES = 3_000;

export type UseConsumptionReturn = {
  /** The window reduced per (connector, measurand, unit) — drives the tiles and the measurand list. */
  consumption: ChargePointConsumption | null;
  /** Raw readings for `measurand`, oldest first (the backend returns newest first). */
  samples: MeterSample[];
  /** Every measurand this station reported in the window, alphabetical (original OCPP names). */
  measurands: string[];
  /** Localized display names for measurands (keyed by original OCPP name). */
  measurandLabels: Record<string, string>;
  /** True when `samples` hit `MAX_CHART_SAMPLES`, so the chart shows a truncated window. */
  truncated: boolean;
  loading: boolean;
  /**
   * Whether the last load failed. A flag, not a message: `t` in the
   * `useCallback` deps would rebuild `load` every render.
   */
  failed: boolean;
  refetch: () => Promise<void>;
};

/**
 * Loads one charge point's metering history for a window, in two requests:
 * the summary (cheap, whole window, lists the reported measurands) then the
 * raw read for the charted measurand, skipped while `measurand` is undefined.
 * `keepPreviousData` keeps the previous window on screen while the next loads.
 */
export const useConsumption = (
  chargePointId: string,
  range: ConsumptionRange,
  measurand: string | undefined,
): UseConsumptionReturn => {
  const t = useTranslations("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.metering.consumptionByChargePoint(chargePointId, { range, measurand }),
    queryFn: async () => {
      // Per call, not in state: a window anchored at mount would go stale.
      const to = new Date();
      const from = new Date(to.getTime() - RANGE_HOURS[range] * 60 * 60 * 1000);

      const [summary, rows] = await Promise.all([
        api.Metering.getConsumption(chargePointId, { from, to }),
        measurand
          ? api.Metering.getMeterSamples(chargePointId, {
              from,
              to,
              measurands: [measurand],
              limit: MAX_CHART_SAMPLES,
            })
          : Promise.resolve([]),
      ]);

      return {
        consumption: summary,
        // Oldest first for the chart; the backend answers newest first.
        samples: [...rows].sort(
          (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime(),
        ),
      };
    },
    placeholderData: keepPreviousData,
  });

  const consumption = data?.consumption ?? null;
  const samples = data?.samples ?? [];

  const measurands = useMemo(
    () =>
      Array.from(new Set(consumption?.series.map((series) => series.measurand) ?? [])).sort(
        (a, b) => a.localeCompare(b),
      ),
    [consumption],
  );

  const measurandLabels = useMemo(
    () =>
      Object.fromEntries(
        measurands.map((measurand) => [
          measurand,
          t(`appPage.chargePoints.consumption.measurands.${measurand.replaceAll(".", "")}`) ??
            measurand,
        ]),
      ),
    [measurands, t],
  );

  return {
    consumption,
    samples,
    measurands,
    measurandLabels,
    truncated: samples.length >= MAX_CHART_SAMPLES,
    loading: isLoading,
    failed: isError,
    refetch: async () => {
      await refetch();
    },
  };
};

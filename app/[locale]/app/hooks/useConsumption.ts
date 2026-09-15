import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { api } from "@/lib/api";
import type { ChargePointConsumption, MeterSample } from "@/lib/api-metering";
import { queryKeys } from "@/lib/queryKeys";

/**
 * The windows the panel offers. Kept short and absolute rather than a free
 * date picker: an installer asks "is it behaving today" or "how did last
 * week look", and every extra control is one more thing between them and the answer.
 */
export const CONSUMPTION_RANGES = ["24h", "7d", "30d"] as const;
export type ConsumptionRange = (typeof CONSUMPTION_RANGES)[number];

const RANGE_HOURS: Record<ConsumptionRange, number> = { "24h": 24, "7d": 24 * 7, "30d": 24 * 30 };

/**
 * Row cap for the raw series read. The backend's ceiling is 10 000; asking
 * for less is the point, not timidity — a 30-day window at a 60s interval
 * holds ~43 000 readings for one measurand, far more than a chart a few
 * hundred pixels wide can draw. The read returns newest rows, so a long
 * window degrades to "the most recent 3 000 readings" — the panel says that
 * out loud rather than silently plotting a partial window as the whole one.
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
   * Whether the last load failed — a flag, not a message; copy lives with
   * the rendering component, keeping `useTranslations` out of this hook (`t`
   * is a fresh identity every render, which in the `useCallback` deps below
   * would rebuild `load` and spin the effect forever).
   */
  failed: boolean;
  refetch: () => Promise<void>;
};

/**
 * Loads one charge point's metering history for a window.
 *
 * Two requests, not one: the summary is cheap and bounded by how many series
 * the station reports, covers the whole window, and tells the panel which
 * measurands exist — the selector is built from what the station actually
 * reported, never a hardcoded OCPP vocabulary. The raw read then narrows to
 * the one measurand being charted.
 *
 * `measurand` undefined (before the first summary lands) skips the raw read
 * entirely, instead of fetching every measurand and discarding most of it.
 *
 * `placeholderData: keepPreviousData` is what avoids flashing a skeleton on
 * every range/measurand change: TanStack Query keeps the previous window's
 * result on screen while the new one loads, swapping it in once ready — the
 * same "only the first load shows a skeleton" behaviour this hook used to
 * hand-roll with a `settled` ref.
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
      // Computed per call, not held in state: a window anchored to "now" at
      // mount would drift stale on a panel left open, and the backend echoes
      // back the window it actually reduced anyway.
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
        // Oldest first: the backend answers newest-first (useful for a
        // list), a chart's x-axis runs the other way.
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

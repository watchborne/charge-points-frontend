import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "@/lib/api";
import type { ChargePointConsumption, MeterSample } from "@/lib/api-metering";

/**
 * The windows the panel offers. Kept short and absolute rather than a free date
 * picker: an installer asks "is it behaving today" or "how did last week look",
 * and every extra control here is one more thing between them and the answer.
 */
export const CONSUMPTION_RANGES = ["24h", "7d", "30d"] as const;
export type ConsumptionRange = (typeof CONSUMPTION_RANGES)[number];

const RANGE_HOURS: Record<ConsumptionRange, number> = { "24h": 24, "7d": 24 * 7, "30d": 24 * 30 };

/**
 * Row cap for the raw series read.
 *
 * The backend's own ceiling is 10 000; asking for less is not timidity but the
 * point of the request — a 30-day window at a 60s sample interval holds ~43 000
 * readings for one measurand, far more than a chart a few hundred pixels wide can
 * draw. The read returns the newest rows, so a long window degrades into "the most
 * recent 3 000 readings", which the panel says out loud rather than quietly
 * plotting a partial window as if it were the whole one.
 */
export const MAX_CHART_SAMPLES = 3_000;

export type UseConsumptionReturn = {
  /** The window reduced per (connector, measurand, unit) — drives the tiles and the measurand list. */
  consumption: ChargePointConsumption | null;
  /** Raw readings for `measurand`, oldest first (the backend returns newest first). */
  samples: MeterSample[];
  /** Every measurand this station reported in the window, alphabetical. */
  measurands: string[];
  /** True when `samples` hit `MAX_CHART_SAMPLES`, so the chart shows a truncated window. */
  truncated: boolean;
  loading: boolean;
  /**
   * Whether the last load failed — a flag, not a message. Copy lives with the
   * component that renders it, which also keeps `useTranslations` out of this
   * hook: `t` is a fresh function identity on every render, and inside the
   * `useCallback` deps below it would rebuild `load` each render and spin the
   * effect forever.
   */
  failed: boolean;
  refetch: () => Promise<void>;
};

/**
 * Loads one charge point's metering history for a window.
 *
 * Two requests rather than one: the summary is cheap and bounded by how many
 * series the station reports, so it can cover the whole window and is what tells
 * the panel which measurands even exist — the selector is built from what the
 * station actually reported, never from a hardcoded OCPP vocabulary. The raw read
 * is then narrowed to the one measurand being charted.
 *
 * `measurand` being undefined (before the first summary lands) skips the raw read
 * entirely instead of fetching every measurand and throwing most of it away.
 */
export const useConsumption = (
  chargePointId: string,
  range: ConsumptionRange,
  measurand: string | undefined,
): UseConsumptionReturn => {
  const [consumption, setConsumption] = useState<ChargePointConsumption | null>(null);
  const [samples, setSamples] = useState<MeterSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  /**
   * Whether a load has ever completed. Only the first one shows the skeleton:
   * this hook is called twice on the way to a first chart (once before the
   * measurand is known, once with it) and again on every window or measurand
   * change, and flipping back to a skeleton each time would strobe a panel that
   * already has something to show. Subsequent loads swap the data in place.
   */
  const settled = useRef(false);

  const load = useCallback(async () => {
    // Computed per call rather than held in state: a window anchored to "now" at
    // mount would drift stale on a panel left open, and the backend echoes back
    // the window it actually reduced anyway.
    const to = new Date();
    const from = new Date(to.getTime() - RANGE_HOURS[range] * 60 * 60 * 1000);

    try {
      setFailed(false);
      if (!settled.current) setLoading(true);

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

      setConsumption(summary);
      // Oldest first: the backend answers newest-first (the useful order for a
      // list), a chart's x-axis runs the other way.
      setSamples(
        [...rows].sort(
          (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime(),
        ),
      );
    } catch (err) {
      setFailed(true);
      console.error(err);
    } finally {
      settled.current = true;
      setLoading(false);
    }
  }, [chargePointId, range, measurand]);

  useEffect(() => {
    load();
  }, [load]);

  const measurands = useMemo(
    () =>
      Array.from(new Set(consumption?.series.map((series) => series.measurand) ?? [])).sort(
        (a, b) => a.localeCompare(b),
      ),
    [consumption],
  );

  return {
    consumption,
    samples,
    measurands,
    truncated: samples.length >= MAX_CHART_SAMPLES,
    loading,
    failed,
    refetch: load,
  };
};

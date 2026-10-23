import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { ConnectionStateEvent, ConnectorStatusEvent } from "@/lib/api-status-history";
import { queryKeys } from "@/lib/queryKeys";

/**
 * The windows the panel offers. "day" is the calendar day (local midnight to
 * now), so the bar has a fixed axis; "7d"/"30d" are rolling, ending now.
 */
export const STATUS_HISTORY_RANGES = ["day", "7d", "30d"] as const;
export type StatusHistoryRange = (typeof STATUS_HISTORY_RANGES)[number];

const windowFor = (range: StatusHistoryRange): { start: Date; end: Date } => {
  const end = new Date();

  if (range === "day") {
    const start = new Date(end);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  const days = range === "7d" ? 7 : 30;
  return { start: new Date(end.getTime() - days * 24 * 60 * 60 * 1000), end };
};

/**
 * Row cap per stream. No `since` is sent, so one read finds both the events in
 * the window and the transition just before it; `truncated` says when 500
 * wasn't enough.
 */
export const HISTORY_FETCH_LIMIT = 500;

export type UseStatusHistoryReturn = {
  windowStart: Date;
  windowEnd: Date;
  connectionEvents: ConnectionStateEvent[];
  connectorEvents: ConnectorStatusEvent[];
  /** True when either stream hit `HISTORY_FETCH_LIMIT` — the seed before the window may be missing. */
  truncated: boolean;
  loading: boolean;
  /** A flag, not a message (see `useConsumption`). */
  failed: boolean;
  refetch: () => Promise<void>;
};

/**
 * Loads one charge point's connection-state and connector-status history for
 * a window, for `computeSegments`/`computeDurations`. Both streams load
 * together so the panel has a single loading state; `keepPreviousData` keeps
 * the previous result on screen while the next loads.
 */
export const useStatusHistory = (
  chargePointId: string,
  range: StatusHistoryRange,
  connectorId: number,
): UseStatusHistoryReturn => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.statusHistory.chargePointWithRanges(chargePointId, [
      range,
      String(connectorId),
    ]),
    queryFn: async () => {
      const window = windowFor(range);

      const [connection, connector] = await Promise.all([
        api.StatusHistory.getConnectionEvents(chargePointId, {
          until: window.end,
          limit: HISTORY_FETCH_LIMIT,
        }),
        api.StatusHistory.getConnectorStatusEvents(chargePointId, {
          connectorId,
          until: window.end,
          limit: HISTORY_FETCH_LIMIT,
        }),
      ]);

      return {
        windowStart: window.start,
        windowEnd: window.end,
        connectionEvents: connection,
        connectorEvents: connector,
        truncated:
          connection.length >= HISTORY_FETCH_LIMIT || connector.length >= HISTORY_FETCH_LIMIT,
      };
    },
    placeholderData: keepPreviousData,
  });

  return {
    windowStart: data?.windowStart ?? windowFor(range).start,
    windowEnd: data?.windowEnd ?? windowFor(range).end,
    connectionEvents: data?.connectionEvents ?? [],
    connectorEvents: data?.connectorEvents ?? [],
    truncated: data?.truncated ?? false,
    loading: isLoading,
    failed: isError,
    refetch: async () => {
      await refetch();
    },
  };
};

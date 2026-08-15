import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import type { ConnectionStateEvent, ConnectorStatusEvent } from "@/lib/api-status-history";

/**
 * The windows the panel offers. "day" is the calendar day (local midnight to
 * now), not a rolling 24h — a progress bar reads naturally against a fixed
 * axis (midnight to midnight), and a rolling window has no fixed start to
 * label. "7d"/"30d" stay rolling, ending now, matching `CONSUMPTION_RANGES`'s
 * convention.
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
 * Row cap for each stream's fetch. No `since` is sent — a single read up to
 * `windowEnd` is what lets `computeSegments` (`lib/status-history.ts`) find
 * both the events inside the window and the seed transition just before it
 * in one round trip. Real transitions are infrequent by design (ADR 0008),
 * so 500 comfortably covers a 30-day window; `truncated` says when it didn't.
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
  /** A flag, not a message — copy lives with the rendering component (see `useConsumption`'s identical note). */
  failed: boolean;
  refetch: () => Promise<void>;
};

/**
 * Loads one charge point's connection-state and connector-status history for
 * a window, ready for `computeSegments`/`computeDurations`.
 *
 * Both streams load together: the connection timeline never depends on which
 * connector is selected, but fetching it alongside keeps the panel's loading
 * state single rather than two independently-flickering ones.
 */
export const useStatusHistory = (
  chargePointId: string,
  range: StatusHistoryRange,
  connectorId: number,
): UseStatusHistoryReturn => {
  const [connectionEvents, setConnectionEvents] = useState<ConnectionStateEvent[]>([]);
  const [connectorEvents, setConnectorEvents] = useState<ConnectorStatusEvent[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [{ start: windowStart, end: windowEnd }, setWindow] = useState(() => windowFor(range));
  // Only the first load shows the skeleton — see useConsumption's identical `settled` note.
  const settled = useRef(false);

  const load = useCallback(async () => {
    const window = windowFor(range);
    setWindow(window);

    try {
      setFailed(false);
      if (!settled.current) setLoading(true);

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

      setConnectionEvents(connection);
      setConnectorEvents(connector);
      setTruncated(
        connection.length >= HISTORY_FETCH_LIMIT || connector.length >= HISTORY_FETCH_LIMIT,
      );
    } catch (err) {
      setFailed(true);
      console.error(err);
    } finally {
      settled.current = true;
      setLoading(false);
    }
  }, [chargePointId, range, connectorId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    windowStart,
    windowEnd,
    connectionEvents,
    connectorEvents,
    truncated,
    loading,
    failed,
    refetch: load,
  };
};

"use client";

import { useEffect, useState } from "react";

import { StatusHistoryPanel } from "./StatusHistoryPanel";
import {
  STATUS_HISTORY_RANGES,
  useStatusHistory,
  type StatusHistoryRange,
} from "../../hooks/useStatusHistory";

type Props = {
  chargePointId: string;
  /** The charge point's connector ordinals — its `connectors[].connectorId`, not the connector rows themselves. */
  connectorIds: number[];
  /**
   * Windows offered by the range picker. Defaults to all of
   * `STATUS_HISTORY_RANGES`; pass a single-element array (e.g. `["day"]`) to
   * lock the panel to that window and hide the picker — used by the charge
   * point detail view's main tab, which only wants "today" at a glance.
   */
  ranges?: readonly StatusHistoryRange[];
};

/**
 * Owns the range/connector selection and the fetch behind it (`useStatusHistory`),
 * handing the reduced result to `StatusHistoryPanel` — the data-owning half
 * of that container/presentational split.
 */
export const StatusHistoryPanelContainer = ({
  chargePointId,
  connectorIds,
  ranges = STATUS_HISTORY_RANGES,
}: Props) => {
  const [range, setRange] = useState<StatusHistoryRange>(ranges[0]);
  const [connectorId, setConnectorId] = useState<number>(connectorIds[0] ?? 1);

  // Follows the charge point's own connectors: a selection that no longer
  // exists (station swapped, or the initial default before connectorIds
  // loaded) falls back to the first one rather than querying a stale id.
  useEffect(() => {
    if (connectorIds.length > 0 && !connectorIds.includes(connectorId)) {
      setConnectorId(connectorIds[0]);
    }
  }, [connectorIds, connectorId]);

  const { windowStart, windowEnd, connectionEvents, connectorEvents, truncated, loading, failed } =
    useStatusHistory(chargePointId, range, connectorId);

  return (
    <StatusHistoryPanel
      range={range}
      ranges={ranges}
      onRangeChange={setRange}
      connectorId={connectorId}
      connectorIds={connectorIds}
      onConnectorIdChange={setConnectorId}
      windowStart={windowStart}
      windowEnd={windowEnd}
      connectionEvents={connectionEvents}
      connectorEvents={connectorEvents}
      truncated={truncated}
      loading={loading}
      failed={failed}
    />
  );
};

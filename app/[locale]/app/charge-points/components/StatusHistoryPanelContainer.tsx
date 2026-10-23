"use client";

import { Callout, Skeleton } from "@watchborne/electrons";
import { useTranslations } from "next-intl";
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
   * Windows offered by the range picker (all by default); a single one locks
   * the panel to it and hides the picker.
   */
  ranges?: readonly StatusHistoryRange[];
};

/**
 * Owns the range/connector selection, the fetch (`useStatusHistory`) and the
 * loading/error states for `StatusHistoryPanel`.
 */
export const StatusHistoryPanelContainer = ({
  chargePointId,
  connectorIds,
  ranges = STATUS_HISTORY_RANGES,
}: Props) => {
  const t = useTranslations("");

  const [range, setRange] = useState<StatusHistoryRange>(ranges[0]);
  const [connectorId, setConnectorId] = useState<number>(connectorIds[0] ?? 1);

  // A connector that no longer exists (or the default before connectorIds
  // load) falls back to the first one.
  useEffect(() => {
    if (connectorIds.length > 0 && !connectorIds.includes(connectorId)) {
      setConnectorId(connectorIds[0]);
    }
  }, [connectorIds, connectorId]);

  const { windowStart, windowEnd, connectionEvents, connectorEvents, truncated, loading, failed } =
    useStatusHistory(chargePointId, range, connectorId);

  if (failed) {
    return <Callout description={t("appPage.chargePoints.statusHistory.error")} variant="error" />;
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

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
    />
  );
};

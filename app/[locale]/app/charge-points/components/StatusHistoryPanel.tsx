"use client";

import { Callout, Skeleton, Tabs, TabsList, TabsTrigger } from "@watchborne/electrons";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConnectionStateEvent, ConnectorStatusEvent } from "@/lib/api-status-history";
import { connectionStatusColor, connectorStatusColor } from "@/lib/status";
import { computeSegments } from "@/lib/status-history";

import { StatusHistoryTable } from "./StatusHistoryTable";
import { StatusTimelineBar } from "./StatusTimelineBar";
import type { StatusHistoryRange } from "../../hooks/useStatusHistory";

type Props = {
  range: StatusHistoryRange;
  /**
   * Windows offered by the range picker. A single-element array (e.g.
   * `["day"]`) locks the panel to that window and hides the picker — used by
   * the charge point detail view's main tab, which only wants "today" at a
   * glance.
   */
  ranges: readonly StatusHistoryRange[];
  onRangeChange: (range: StatusHistoryRange) => void;
  connectorId: number;
  /** The charge point's connector ordinals — its `connectors[].connectorId`, not the connector rows themselves. */
  connectorIds: number[];
  onConnectorIdChange: (connectorId: number) => void;
  windowStart: Date;
  windowEnd: Date;
  connectionEvents: ConnectionStateEvent[];
  connectorEvents: ConnectorStatusEvent[];
  truncated: boolean;
  loading: boolean;
  failed: boolean;
};

/**
 * A charge point's connection-state and connector-status history (ADR 0008
 * in `charge-points-server`): a day/7-day timeline bar for "what does this
 * period look like", and a 30-day breakdown table for "how much time in
 * each status, and when". Both streams render stacked, always together —
 * connectivity and connector activity are two different questions
 * (`docs/ai/domain-model.md`'s Critical Domain Rule), never one chart.
 *
 * Purely presentational — `StatusHistoryPanelContainer` owns the range/connector
 * selection and the fetch behind it, so the marketing site's product preview
 * can render this directly with static events instead of duplicating the
 * markup. `computeSegments` stays here since it is a pure derivation from
 * props, not a side effect.
 */
export const StatusHistoryPanel = ({
  range,
  ranges,
  onRangeChange,
  connectorId,
  connectorIds,
  onConnectorIdChange,
  windowStart,
  windowEnd,
  connectionEvents,
  connectorEvents,
  truncated,
  loading,
  failed,
}: Props) => {
  const t = useTranslations("");

  const connectionSegments = useMemo(
    () => computeSegments(connectionEvents, windowStart, windowEnd),
    [connectionEvents, windowStart, windowEnd],
  );
  const connectorSegments = useMemo(
    () => computeSegments(connectorEvents, windowStart, windowEnd),
    [connectorEvents, windowStart, windowEnd],
  );

  if (failed) {
    return <Callout description={t("appPage.chargePoints.statusHistory.error")} variant="error" />;
  }

  const unknownLabel = t("appPage.chargePoints.statusHistory.noData");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{t("appPage.chargePoints.statusHistory.title")}</h4>

        <div className="flex flex-wrap items-center gap-2">
          {ranges.length > 1 && (
            <Tabs
              value={range}
              onValueChange={(value) => onRangeChange(value as StatusHistoryRange)}
              className="overflow-auto"
            >
              <TabsList>
                {ranges.map((option) => (
                  <TabsTrigger key={option} value={option} className="text-xs">
                    {t(`appPage.chargePoints.statusHistory.ranges.${option}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {connectorIds.length > 1 && (
            <Select
              value={String(connectorId)}
              onValueChange={(value) => onConnectorIdChange(Number(value))}
            >
              <SelectTrigger
                className="h-8 w-[150px] text-xs"
                aria-label={t("appPage.chargePoints.statusHistory.connectorLabel")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {connectorIds.map((id) => (
                  <SelectItem key={id} value={String(id)} className="text-xs">
                    {t("appPage.chargePoints.consumption.connectorSeries", { connectorId: id })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {t("appPage.chargePoints.statusHistory.connectivity")}
            </p>
            {range === "30d" ? (
              <StatusHistoryTable
                segments={connectionSegments}
                toneOf={connectionStatusColor}
                label={(status) => status}
                unknownLabel={unknownLabel}
                timestampHeader={t("appPage.chargePoints.statusHistory.table.timestamp")}
                statusHeader={t("appPage.chargePoints.statusHistory.table.status")}
                durationHeader={t("appPage.chargePoints.statusHistory.table.duration")}
              />
            ) : (
              <StatusTimelineBar
                segments={connectionSegments}
                windowStart={windowStart}
                windowEnd={windowEnd}
                toneOf={connectionStatusColor}
                label={(status) => status}
                ariaLabel={t("appPage.chargePoints.statusHistory.connectivity")}
                unknownLabel={unknownLabel}
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {t("appPage.chargePoints.statusHistory.connectorStatus", { connectorId })}
            </p>
            {range === "30d" ? (
              <StatusHistoryTable
                segments={connectorSegments}
                toneOf={connectorStatusColor}
                label={(status) => status}
                unknownLabel={unknownLabel}
                timestampHeader={t("appPage.chargePoints.statusHistory.table.timestamp")}
                statusHeader={t("appPage.chargePoints.statusHistory.table.status")}
                durationHeader={t("appPage.chargePoints.statusHistory.table.duration")}
              />
            ) : (
              <StatusTimelineBar
                segments={connectorSegments}
                windowStart={windowStart}
                windowEnd={windowEnd}
                toneOf={connectorStatusColor}
                label={(status) => status}
                ariaLabel={t("appPage.chargePoints.statusHistory.connectorStatus", { connectorId })}
                unknownLabel={unknownLabel}
              />
            )}
          </div>

          {truncated && (
            <p className="text-[11px] text-muted-foreground">
              {t("appPage.chargePoints.statusHistory.truncated")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

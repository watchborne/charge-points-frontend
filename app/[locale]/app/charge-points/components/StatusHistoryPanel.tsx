"use client";

import { Tabs, TabsList, TabsTrigger } from "@watchborne/electrons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@watchborne/electrons";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import type { ConnectionStateEvent, ConnectorStatusEvent } from "@/lib/api-status-history";
import { csvFilenameDate } from "@/lib/csv";
import { connectionStatusColor, connectorStatusColor } from "@/lib/status";
import { computeSegments } from "@/lib/status-history";

import { StatusHistoryTable } from "./StatusHistoryTable";
import { StatusTimelineBar } from "./StatusTimelineBar";
import { CsvExportButton } from "../../components/common/CsvExportButton";
import type { StatusHistoryRange } from "../../hooks/useStatusHistory";

type Props = {
  range: StatusHistoryRange;
  /**
   * Windows offered by the range picker; a single one (e.g. `["day"]`) locks
   * the panel to it and hides the picker.
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
};

/**
 * A charge point's connection-state and connector-status history: a timeline
 * bar for the day/7 days and a breakdown table for 30 days. Both streams are
 * always shown, stacked: connectivity and connector activity are different
 * questions.
 *
 * Presentational: `StatusHistoryPanelContainer` owns the selection, the fetch
 * and the loading/error states.
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

  // The raw transitions of both streams (connectivity and the selected
  // connector), not the derived segments: that is what an audit needs.
  const exportRows = () => [
    [
      t("appPage.chargePoints.statusHistory.export.stream"),
      t("appPage.chargePoints.statusHistory.table.timestamp"),
      t("appPage.chargePoints.statusHistory.table.status"),
    ],
    ...[...connectionEvents]
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
      .map((event) => [
        t("appPage.chargePoints.statusHistory.connectivity"),
        event.occurredAt,
        event.status,
      ]),
    ...[...connectorEvents]
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
      .map((event) => [
        t("appPage.chargePoints.statusHistory.connectorStatus", { connectorId }),
        event.occurredAt,
        event.status,
      ]),
  ];

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

          <CsvExportButton
            getRows={exportRows}
            filename={`status-history-${range}-${csvFilenameDate()}.csv`}
            disabled={connectionEvents.length === 0 && connectorEvents.length === 0}
          />
        </div>
      </div>

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
    </div>
  );
};

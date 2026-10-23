"use client";

import { useQuery } from "@tanstack/react-query";
import { Callout } from "@watchborne/electrons";
import { CheckCircle2, Clock, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { api } from "@/lib/api";
import type { DeviceEventEntry, DeviceEventReport } from "@/lib/api-device-events";
import { useDateFormat } from "@/lib/date-format";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";

type DeviceEventsPanelProps = {
  chargePointId: ChargePoint["id"];
};

/** Recent frames only. */
const VISIBLE_REPORT_COUNT = 5;

type FlatEntry = DeviceEventEntry & { reportId: string; generatedAt: string };

/** One row per `events[]` entry: a frame can bundle unrelated reports. */
const flattenReports = (reports: DeviceEventReport[]): FlatEntry[] =>
  reports.flatMap((report) =>
    report.events.map((event) => ({
      ...event,
      reportId: report.id,
      generatedAt: report.generatedAt,
    })),
  );

const componentLabel = (entry: DeviceEventEntry): string =>
  entry.variable.name ? `${entry.component.name} · ${entry.variable.name}` : entry.component.name;

/**
 * A charge point's `NotifyEvent` history: fault and variable-change reports a
 * 2.0.1 station sends on its own, stored but never projected onto
 * `Connector.status`. Fetch-once.
 */
export const DeviceEventsPanel = ({ chargePointId }: DeviceEventsPanelProps) => {
  const t = useTranslations("");
  const { formatRelative, formatDateTime } = useDateFormat();

  const {
    data: reports,
    isLoading: loading,
    isError: failed,
  } = useQuery({
    queryKey: queryKeys.deviceEvents.chargePoint(chargePointId),
    queryFn: () => api.DeviceEvents.list(chargePointId, VISIBLE_REPORT_COUNT),
  });

  const entries = useMemo(() => flattenReports(reports ?? []), [reports]);

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold">{t("appPage.chargePoints.deviceEvents.title")}</h4>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 animate-pulse" />
          {t("appPage.chargePoints.deviceEvents.loading")}
        </div>
      )}

      {!loading && failed && (
        <Callout description={t("appPage.chargePoints.deviceEvents.loadError")} variant="error" />
      )}

      {!loading && !failed && entries.length === 0 && (
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.deviceEvents.empty")}
        </span>
      )}

      {!loading && !failed && entries.length > 0 && (
        <div className="divide-y rounded-md border">
          {entries.map((entry, index) => (
            <div
              key={`${entry.reportId}-${entry.eventId}-${index}`}
              className="flex flex-col gap-1.5 px-3 py-2"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {entry.cleared ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Radio className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                {componentLabel(entry)}
              </span>

              <span className="text-xs text-muted-foreground">
                {t("appPage.chargePoints.deviceEvents.trigger")}: {entry.trigger} —{" "}
                {entry.actualValue}
              </span>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{formatRelative(entry.timestamp)}</span>
                <span>({formatDateTime(entry.timestamp)})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

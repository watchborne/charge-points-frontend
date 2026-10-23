"use client";

import { useQuery } from "@tanstack/react-query";
import { Callout } from "@watchborne/electrons";
import { Clock, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { api } from "@/lib/api";
import type {
  DeviceVariableReport,
  DeviceVariableReportEntry,
} from "@/lib/api-device-variable-reports";
import { useDateFormat } from "@/lib/date-format";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";

import { RequestDeviceReportDialog } from "./RequestDeviceReportDialog";

type DeviceVariableReportsPanelProps = {
  chargePointId: ChargePoint["id"];
  /** The charge point is deactivated: no command may be sent to it. */
  disabled?: boolean;
};

/** Recent frames only. */
const VISIBLE_REPORT_COUNT = 5;

type FlatEntry = DeviceVariableReportEntry & { reportId: string; generatedAt: string };

/** One row per component/variable pair: a frame can bundle a whole inventory. */
const flattenReports = (reports: DeviceVariableReport[]): FlatEntry[] =>
  reports.flatMap((report) =>
    report.entries.map((entry) => ({
      ...entry,
      reportId: report.id,
      generatedAt: report.generatedAt,
    })),
  );

const componentLabel = (entry: DeviceVariableReportEntry): string =>
  entry.variable.name ? `${entry.component.name} · ${entry.variable.name}` : entry.component.name;

/** "Actual: 30 · Target: 32" — only attributes carrying a value are shown. */
const attributesLabel = (entry: DeviceVariableReportEntry): string =>
  entry.attributes
    .filter((attribute) => attribute.value !== undefined)
    .map((attribute) => `${attribute.type ?? "Actual"}: ${attribute.value}`)
    .join(" · ");

/**
 * A charge point's `NotifyReport` history (2.0.1): every frame, whether or not
 * it answers a `GetBaseReport`/`GetReport` this supervisor sent. Fetch-once.
 */
export const DeviceVariableReportsPanel = ({
  chargePointId,
  disabled = false,
}: DeviceVariableReportsPanelProps) => {
  const t = useTranslations("");
  const { formatRelative, formatDateTime } = useDateFormat();

  const {
    data: reports,
    isLoading: loading,
    isError: failed,
    refetch,
  } = useQuery({
    queryKey: queryKeys.deviceVariableReports.chargePoint(chargePointId),
    queryFn: () => api.DeviceVariableReports.list(chargePointId, VISIBLE_REPORT_COUNT),
  });

  const entries = useMemo(() => flattenReports(reports ?? []), [reports]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          {t("appPage.chargePoints.deviceVariableReports.title")}
        </h4>
        <RequestDeviceReportDialog
          disabled={disabled}
          chargePointId={chargePointId}
          onRequested={() => void refetch()}
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 animate-pulse" />
          {t("appPage.chargePoints.deviceVariableReports.loading")}
        </div>
      )}

      {!loading && failed && (
        <Callout
          description={t("appPage.chargePoints.deviceVariableReports.loadError")}
          variant="error"
        />
      )}

      {!loading && !failed && entries.length === 0 && (
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.deviceVariableReports.empty")}
        </span>
      )}

      {!loading && !failed && entries.length > 0 && (
        <div className="divide-y rounded-md border">
          {entries.map((entry, index) => (
            <div
              key={`${entry.reportId}-${entry.component.name}-${entry.variable.name}-${index}`}
              className="flex flex-col gap-1.5 px-3 py-2"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
                {componentLabel(entry)}
              </span>

              {attributesLabel(entry) && (
                <span className="text-xs text-muted-foreground">{attributesLabel(entry)}</span>
              )}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{formatRelative(entry.generatedAt)}</span>
                <span>({formatDateTime(entry.generatedAt)})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

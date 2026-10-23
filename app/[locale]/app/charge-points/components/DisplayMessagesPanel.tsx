"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Callout } from "@watchborne/electrons";
import { Clock, MessageSquare, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { api } from "@/lib/api";
import type { DisplayMessageInfo, DisplayMessageReport } from "@/lib/api-display-messages";
import { useDateFormat } from "@/lib/date-format";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";

type DisplayMessagesPanelProps = {
  chargePointId: ChargePoint["id"];
  /** The charge point is deactivated: no command may be sent to it. */
  disabled?: boolean;
};

/** Recent frames only. */
const VISIBLE_REPORT_COUNT = 5;

type FlatEntry = DisplayMessageInfo & { reportId: string; createdAt: string };

/** One row per message: a frame can bundle several. */
const flattenReports = (reports: DisplayMessageReport[]): FlatEntry[] =>
  reports.flatMap((report) =>
    report.messageInfo.map((info) => ({
      ...info,
      reportId: report.id,
      createdAt: report.createdAt,
    })),
  );

type RequestOutcome = { ok: true } | { ok: false; httpStatus: number };

const errorMessageKey = (httpStatus: number): string => {
  switch (httpStatus) {
    case 404:
      return "appPage.chargePoints.displayMessages.result.notFound";
    case 409:
      return "appPage.chargePoints.displayMessages.result.notConnectedOrUnsupported";
    case 502:
      return "appPage.chargePoints.displayMessages.result.stationError";
    case 504:
      return "appPage.chargePoints.displayMessages.result.timeout";
    default:
      return "appPage.chargePoints.displayMessages.result.genericError";
  }
};

/**
 * A charge point's `NotifyDisplayMessages` history (2.0.1). "Refresh" sends an
 * unfiltered `GetDisplayMessages`: the station only acknowledges, and the
 * messages arrive as `NotifyDisplayMessages` frames picked up on the next
 * fetch.
 */
export const DisplayMessagesPanel = ({
  chargePointId,
  disabled = false,
}: DisplayMessagesPanelProps) => {
  const t = useTranslations("");
  const { formatRelative, formatDateTime } = useDateFormat();

  const {
    data: reports,
    isLoading: loading,
    isError: failed,
    refetch,
  } = useQuery({
    queryKey: queryKeys.displayMessages.chargePoint(chargePointId),
    queryFn: () => api.DisplayMessages.list(chargePointId, VISIBLE_REPORT_COUNT),
  });

  const entries = useMemo(() => flattenReports(reports ?? []), [reports]);

  const {
    mutate: requestRefresh,
    isPending: refreshing,
    data: requestOutcome,
  } = useMutation<RequestOutcome>({
    mutationFn: () => api.DisplayMessages.requestAll(chargePointId),
    onSuccess: (outcome) => {
      if (outcome.ok) void refetch();
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{t("appPage.chargePoints.displayMessages.title")}</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => requestRefresh()}
          loading={refreshing}
          disabled={disabled}
        >
          {!refreshing && <RefreshCw className="mr-1.5 h-4 w-4" />}
          {t("appPage.chargePoints.displayMessages.refresh")}
        </Button>
      </div>

      {requestOutcome && !requestOutcome.ok && (
        <Callout description={t(errorMessageKey(requestOutcome.httpStatus))} variant="error" />
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 animate-pulse" />
          {t("appPage.chargePoints.displayMessages.loading")}
        </div>
      )}

      {!loading && failed && (
        <Callout
          description={t("appPage.chargePoints.displayMessages.loadError")}
          variant="error"
        />
      )}

      {!loading && !failed && entries.length === 0 && (
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.displayMessages.empty")}
        </span>
      )}

      {!loading && !failed && entries.length > 0 && (
        <div className="divide-y rounded-md border">
          {entries.map((entry, index) => (
            <div
              key={`${entry.reportId}-${entry.id}-${index}`}
              className="flex flex-col gap-1.5 px-3 py-2"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                {entry.message.content}
              </span>

              <span className="text-xs text-muted-foreground">
                {t(`appPage.chargePoints.displayMessage.set.priorities.${entry.priority}`)}
                {entry.state ? ` · ${entry.state}` : ""}
              </span>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{formatRelative(entry.createdAt)}</span>
                <span>({formatDateTime(entry.createdAt)})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

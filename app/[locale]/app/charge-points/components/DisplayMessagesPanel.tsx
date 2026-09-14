"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Callout } from "@watchborne/electrons";
import { format, formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";
import { Clock, Loader2, MessageSquare, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { api } from "@/lib/api";
import type { DisplayMessageInfo, DisplayMessageReport } from "@/lib/api-display-messages";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";

type DisplayMessagesPanelProps = {
  chargePointId: ChargePoint["id"];
};

/** How many recent frames the panel fetches — a glance at the latest
 * messages, not a full audit log, the same cap `DeviceVariableReportsPanel`/
 * `SecurityEventsPanel` use. */
const VISIBLE_REPORT_COUNT = 5;

type FlatEntry = DisplayMessageInfo & { reportId: string; createdAt: string };

/** Flattens each report's `messageInfo[]` into one row per message, since a
 * frame can bundle several messages together. */
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
 * A charge point's `NotifyDisplayMessages` history (charge-points-server
 * issue #536, same ADR 0014 shape as `DeviceVariableReportsPanel`) — every
 * display message the station has reported. The single "Refresh" action
 * always asks for the full set (OCPP `GetDisplayMessages`, unfiltered): this
 * panel exists to answer "what is this station showing right now," not to
 * slice through messages by id/priority/state, so there is no filter UI —
 * every request is unfiltered, on purpose. Acknowledgment-only round trip —
 * the actual messages arrive later as one or more `NotifyDisplayMessages`
 * frames, picked up on the panel's next fetch. 2.0.1 only: this panel only
 * ever renders inside a 2.0.1-gated section.
 */
export const DisplayMessagesPanel = ({ chargePointId }: DisplayMessagesPanelProps) => {
  const t = useTranslations("");

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
        <Button variant="outline" size="sm" onClick={() => requestRefresh()} disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-4 w-4" />
          )}
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
                <span>
                  {formatDistanceToNow(new Date(entry.createdAt), {
                    addSuffix: true,
                    locale: enGB,
                  })}
                </span>
                <span>({format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm")})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

"use client";

import { useQuery } from "@tanstack/react-query";
import { Callout } from "@watchborne/electrons";
import { AlertTriangle, CheckCircle2, Clock, FileText, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { api } from "@/lib/api";
import { useDateFormat } from "@/lib/date-format";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";
import type { LogUploadView } from "@/types/log-upload";

import { StartLogUploadDialog } from "./StartLogUploadDialog";

type LogUploadPanelProps = {
  chargePointId: ChargePoint["id"];
  /** Gates the "Security log" option in the trigger dialog. */
  ocppVersion: ChargePoint["ocppVersion"];
  /** The charge point is deactivated: no command may be sent to it. */
  disabled?: boolean;
};

/** Recent uploads only. */
const VISIBLE_HISTORY_COUNT = 5;

/**
 * A charge point's remote log retrieval (`GetDiagnostics`/`GetLog`): the
 * running upload, the last finished one and a short history. A log upload has
 * a flat status, not a phase timeline. Fetch-once.
 */
export const LogUploadPanel = ({
  chargePointId,
  ocppVersion,
  disabled = false,
}: LogUploadPanelProps) => {
  const t = useTranslations("");
  const { formatRelative, formatDateTime } = useDateFormat();

  const {
    data: logUpload,
    isLoading: loading,
    isError: failed,
    refetch,
  } = useQuery({
    queryKey: queryKeys.logUpload.chargePoint(chargePointId),
    queryFn: () => api.ChargePoints.getLogUpload(chargePointId),
  });

  const {
    data: history = [] as LogUploadView[],
    isError: historyFailed,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: queryKeys.logUpload.history(chargePointId),
    queryFn: () => api.ChargePoints.listLogUploads(chargePointId, VISIBLE_HISTORY_COUNT),
  });

  const reload = () => {
    void refetch();
    void refetchHistory();
  };

  const outcomeIcon = (upload: LogUploadView) =>
    upload.outcome === "SUCCEEDED" ? (
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-status-available-foreground" />
    ) : (
      <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
    );

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.logUpload.title")}
        </span>
        <StartLogUploadDialog
          disabled={disabled}
          chargePointId={chargePointId}
          ocppVersion={ocppVersion}
          // The backend refuses a second unfinished upload, so the trigger is
          // disabled upfront.
          uploadInProgress={(logUpload?.active ?? null) !== null}
          onStarted={reload}
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("appPage.chargePoints.logUpload.loading")}
        </div>
      )}

      {!loading && failed && (
        <Callout description={t("appPage.chargePoints.logUpload.loadError")} variant="error" />
      )}

      {!loading && !failed && logUpload && (
        <>
          {logUpload.active && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  {t("appPage.chargePoints.logUpload.inProgress")}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t(`appPage.chargePoints.logUpload.statuses.${logUpload.active.status}`)}
                </span>
              </div>
              {logUpload.active.fileName && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3 shrink-0" />
                  {logUpload.active.fileName}
                </span>
              )}
              {logUpload.active.isStalled && (
                <div className="flex items-center gap-1.5 text-xs text-status-warning-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {t("appPage.chargePoints.logUpload.stalled")}
                </div>
              )}
            </div>
          )}

          {logUpload.lastCompleted ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">
                {t("appPage.chargePoints.logUpload.lastUpload")}
              </span>
              <span className="flex flex-col items-end text-sm font-medium">
                <span className="flex items-center gap-1.5">
                  {outcomeIcon(logUpload.lastCompleted)}
                  {formatRelative(logUpload.lastCompleted.finishedAt!)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDateTime(logUpload.lastCompleted.finishedAt!)}
                  {logUpload.lastCompleted.fileName && ` · ${logUpload.lastCompleted.fileName}`}
                </span>
              </span>
            </div>
          ) : (
            !logUpload.active && (
              <span className="text-sm text-muted-foreground">
                {t("appPage.chargePoints.logUpload.neverUploaded")}
              </span>
            )
          )}

          {logUpload.lastCompleted?.outcome === "FAILED" && (
            <Callout
              description={t(
                `appPage.chargePoints.logUpload.statuses.${logUpload.lastCompleted.status}`,
              )}
              variant="error"
            />
          )}

          <div className="flex flex-col gap-1.5 border-t pt-3">
            <span className="text-xs font-medium text-muted-foreground">
              {t("appPage.chargePoints.logUpload.history.title")}
            </span>

            {historyFailed && (
              <Callout
                description={t("appPage.chargePoints.logUpload.history.loadError")}
                variant="error"
              />
            )}

            {!historyFailed && history.length === 0 && (
              <span className="text-xs text-muted-foreground">
                {t("appPage.chargePoints.logUpload.history.empty")}
              </span>
            )}

            {!historyFailed && history.length > 0 && (
              <div className="divide-y rounded-md border">
                {history.map((upload) => (
                  <div key={upload.id} className="flex flex-col gap-1 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">
                        {t(`appPage.chargePoints.logUpload.logTypes.${upload.logType}`)}
                      </span>
                      {upload.outcome ? (
                        <span className="flex items-center gap-1 text-xs">
                          {outcomeIcon(upload)}
                          {t(`appPage.chargePoints.logUpload.statuses.${upload.status}`)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {t(`appPage.chargePoints.logUpload.statuses.${upload.status}`)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      {formatDateTime(upload.startedAt)}
                      {upload.fileName && ` · ${upload.fileName}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

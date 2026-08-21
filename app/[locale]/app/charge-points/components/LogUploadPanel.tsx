"use client";

import { Callout } from "@watchborne/electrons";
import { format, formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, Clock, FileText, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { ChargePoint } from "@/types/charge-point";
import type { ChargePointLogUpload, LogUploadView } from "@/types/log-upload";

import { StartLogUploadDialog } from "./StartLogUploadDialog";

type LogUploadPanelProps = {
  chargePointId: ChargePoint["id"];
  /** Gates the "Security log" option in the trigger dialog. */
  ocppVersion: ChargePoint["ocppVersion"];
};

const EMPTY: ChargePointLogUpload = { active: null, lastCompleted: null };

/** How many recent uploads the history list shows — a glance at recent
 * activity, not a full audit log, the same cap `AlertsPanel`/
 * `SecurityEventsPanel` use for their own histories. */
const VISIBLE_HISTORY_COUNT = 5;

/**
 * The remote-log-retrieval section of a charge point's detail panel: which
 * upload is running, what its last finished one did, and a short history —
 * the `FirmwarePanel` equivalent for OCPP `GetDiagnostics`/`GetLog` (issue
 * #415).
 *
 * Unlike `FirmwarePanel`, a log upload has no phase timeline to derive
 * (`LogUpload` carries a flat status, not `FirmwareUpdate`'s
 * download/signature/install/reboot steps) — its progress is just "what
 * status did the station last report", shown directly. There is also no
 * dedicated WebSocket broadcast for this yet, so — like `AlertsPanel` and
 * `SecurityEventsPanel` — this is self-contained and fetch-once rather than
 * subscribing to the dashboard socket.
 */
export const LogUploadPanel = ({ chargePointId, ocppVersion }: LogUploadPanelProps) => {
  const t = useTranslations("");

  const [logUpload, setLogUpload] = useState<ChargePointLogUpload>(EMPTY);
  const [history, setHistory] = useState<LogUploadView[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [historyFailed, setHistoryFailed] = useState(false);

  const load = useCallback(
    async (showLoading: boolean) => {
      if (showLoading) setLoading(true);
      try {
        const [current, recent] = await Promise.all([
          api.ChargePoints.getLogUpload(chargePointId),
          api.ChargePoints.listLogUploads(chargePointId, VISIBLE_HISTORY_COUNT).catch(() => {
            setHistoryFailed(true);
            return null;
          }),
        ]);
        setLogUpload(current);
        setFailed(false);
        if (recent !== null) {
          setHistory(recent);
          setHistoryFailed(false);
        }
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [chargePointId],
  );

  useEffect(() => {
    // Reset before refetching so a different station's uploads are never
    // shown under this one while the request is in flight.
    setLogUpload(EMPTY);
    setHistory([]);
    void load(true);
  }, [load]);

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
          chargePointId={chargePointId}
          ocppVersion={ocppVersion}
          // The backend refuses a second concurrent upload (at most one
          // unfinished per charge point); disabling the trigger says so
          // before the installer fills a form that would be rejected.
          uploadInProgress={logUpload.active !== null}
          onStarted={() => void load(false)}
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

      {!loading && !failed && (
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
                  {formatDistanceToNow(new Date(logUpload.lastCompleted.finishedAt!), {
                    addSuffix: true,
                    locale: enGB,
                  })}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(logUpload.lastCompleted.finishedAt!), "dd/MM/yyyy HH:mm")}
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
                      {format(new Date(upload.startedAt), "dd/MM/yyyy HH:mm")}
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

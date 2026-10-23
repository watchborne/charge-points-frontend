"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge, Callout } from "@watchborne/electrons";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { api } from "@/lib/api";
import { useDateFormat } from "@/lib/date-format";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint, ChargePointMeta } from "@/types/charge-point";
import type { FirmwareUpdateView } from "@/types/firmware";

import { UpdateFirmwareDialog } from "./UpdateFirmwareDialog";
import { FirmwareTimeline } from "../../components/charge-points/FirmwareTimeline";
import { useWebSocketContext } from "../../hooks/useWebSocketContext";

type FirmwarePanelProps = {
  chargePointId: ChargePoint["id"];
  /** The version the station itself last reported, via BootNotification. */
  firmwareVersion: ChargePointMeta["firmwareVersion"];
  /** Gates the signed-firmware fields in the trigger dialog. */
  ocppVersion: ChargePoint["ocppVersion"];
  /** The charge point is deactivated: no command may be sent to it. */
  disabled?: boolean;
};

/**
 * A charge point's firmware: the running version, the update in flight and
 * the last completed one. Fetches its own data and refreshes on
 * `CHARGE_POINT_FIRMWARE_UPDATE`.
 */
export const FirmwarePanel = ({
  chargePointId,
  firmwareVersion,
  ocppVersion,
  disabled = false,
}: FirmwarePanelProps) => {
  const t = useTranslations("");
  const { formatRelative, formatDateTime } = useDateFormat();
  const { lastMessage } = useWebSocketContext();

  const {
    data: firmware,
    isLoading: loading,
    isError: failed,
    refetch,
  } = useQuery({
    queryKey: queryKeys.firmware.chargePoint(chargePointId),
    queryFn: () => api.ChargePoints.getFirmware(chargePointId),
  });

  useEffect(() => {
    if (lastMessage?.type !== "CHARGE_POINT_FIRMWARE_UPDATE") return;

    const update = lastMessage.payload?.firmwareUpdate as FirmwareUpdateView | undefined;
    // The broadcast covers every visible charge point; keep this one's.
    if (!update || update.chargePointId !== chargePointId) return;

    // Refetch: the broadcast doesn't say whether the update moved to
    // `lastCompleted`.
    void refetch();
  }, [lastMessage, chargePointId, refetch]);

  const outcomeIcon = (update: FirmwareUpdateView) =>
    update.outcome === "SUCCEEDED" ? (
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-status-available-foreground" />
    ) : (
      <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
    );

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.firmware.title")}
        </span>
        {firmwareVersion ? (
          <Badge variant="outline" className="font-mono text-xs">
            v{firmwareVersion}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t("appPage.chargePoints.firmware.unknownVersion")}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("appPage.chargePoints.firmware.loading")}
        </div>
      )}

      {!loading && failed && (
        <Callout description={t("appPage.chargePoints.firmware.loadError")} variant="error" />
      )}

      {!loading && !failed && firmware && (
        <>
          {firmware.active && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  {t("appPage.chargePoints.firmware.inProgress")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t(`appPage.chargePoints.firmware.origins.${firmware.active.origin}`)}
                </span>
              </div>
              <FirmwareTimeline update={firmware.active} />
            </div>
          )}

          {firmware.lastCompleted ? (
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground">
                {t("appPage.chargePoints.firmware.lastUpdate")}
              </div>
              <div className="flex gap-3 flex-wrap items-center justify-end">
                <div className="flex flex-col items-end text-sm font-medium">
                  <div className="flex items-center gap-1.5">
                    {outcomeIcon(firmware.lastCompleted)}
                    {formatRelative(firmware.lastCompleted.finishedAt!)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatDateTime(firmware.lastCompleted.finishedAt!)}
                    {firmware.lastCompleted.toVersion &&
                      ` · ${firmware.lastCompleted.fromVersion ?? "?"} → ${firmware.lastCompleted.toVersion}`}
                  </div>
                </div>

                <UpdateFirmwareDialog
                  disabled={disabled}
                  chargePointId={chargePointId}
                  ocppVersion={ocppVersion}
                  // The backend refuses a second unfinished update, so the
                  // trigger is disabled upfront.
                  updateInProgress={firmware.active !== null}
                  onStarted={() => void refetch()}
                />
              </div>
            </div>
          ) : (
            !firmware.active && (
              <span className="text-sm text-muted-foreground">
                {t("appPage.chargePoints.firmware.neverUpdated")}
              </span>
            )
          )}

          {firmware.lastCompleted?.outcome === "FAILED" && (
            <Callout
              description={
                firmware.lastCompleted.failureInfo ??
                t(`appPage.chargePoints.firmware.statuses.${firmware.lastCompleted.status}`)
              }
              variant="error"
            />
          )}
        </>
      )}
    </div>
  );
};

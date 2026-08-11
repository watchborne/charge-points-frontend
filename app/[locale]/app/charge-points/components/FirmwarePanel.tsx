"use client";

import { Badge, Callout } from "@watchborne/electrons";
import { format, formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { ChargePoint, ChargePointMeta } from "@/types/charge-point";
import type { ChargePointFirmware, FirmwareUpdateView } from "@/types/firmware";

import { UpdateFirmwareDialog } from "./UpdateFirmwareDialog";
import { FirmwareTimeline } from "../../components/charge-points/FirmwareTimeline";
import { useWebSocketContext } from "../../hooks/useWebSocketContext";

type FirmwarePanelProps = {
  chargePointId: ChargePoint["id"];
  /** The version the station itself last reported, via BootNotification. */
  firmwareVersion: ChargePointMeta["firmwareVersion"];
  /** Gates the signed-firmware fields in the trigger dialog. */
  ocppVersion: ChargePoint["ocppVersion"];
};

const EMPTY: ChargePointFirmware = { active: null, lastCompleted: null };

/**
 * The firmware section of a charge point's detail panel: which version it runs,
 * what an update in flight is doing, and when it was last updated.
 *
 * Self-contained — it fetches its own data rather than being threaded through the
 * detail panel's props, which keeps that already-large component from growing a
 * fourth concern. It refreshes on `CHARGE_POINT_FIRMWARE_UPDATE`, the dedicated
 * broadcast the backend emits only from the FirmwareStatusNotification handler.
 */
export const FirmwarePanel = ({
  chargePointId,
  firmwareVersion,
  ocppVersion,
}: FirmwarePanelProps) => {
  const t = useTranslations("");
  const { lastMessage } = useWebSocketContext();

  const [firmware, setFirmware] = useState<ChargePointFirmware>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(
    async (showLoading: boolean) => {
      if (showLoading) setLoading(true);
      try {
        setFirmware(await api.ChargePoints.getFirmware(chargePointId));
        setFailed(false);
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [chargePointId],
  );

  useEffect(() => {
    // Reset before refetching so a different station's firmware is never shown
    // under this one's name while the request is in flight.
    setFirmware(EMPTY);
    void load(true);
  }, [load]);

  useEffect(() => {
    if (lastMessage?.type !== "CHARGE_POINT_FIRMWARE_UPDATE") return;

    const update = lastMessage.payload?.firmwareUpdate as FirmwareUpdateView | undefined;
    // The broadcast is already scoped to charge points the caller can see, but a
    // dashboard shows one station at a time — ignore the others'.
    if (!update || update.chargePointId !== chargePointId) return;

    // Refetch rather than patching `active` from the payload: a terminal status
    // moves the update from `active` to `lastCompleted`, and the broadcast alone
    // does not say which side it landed on.
    void load(false);
  }, [lastMessage, chargePointId, load]);

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

      {!loading && !failed && (
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
              <span className="text-sm text-muted-foreground">
                {t("appPage.chargePoints.firmware.lastUpdate")}
              </span>
              <span className="flex flex-col items-end text-sm font-medium">
                <span className="flex items-center gap-1.5">
                  {outcomeIcon(firmware.lastCompleted)}
                  {formatDistanceToNow(new Date(firmware.lastCompleted.finishedAt!), {
                    addSuffix: true,
                    locale: enGB,
                  })}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(firmware.lastCompleted.finishedAt!), "dd/MM/yyyy HH:mm")}
                  {firmware.lastCompleted.toVersion &&
                    ` · ${firmware.lastCompleted.fromVersion ?? "?"} → ${firmware.lastCompleted.toVersion}`}
                </span>
              </span>
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

          <UpdateFirmwareDialog
            chargePointId={chargePointId}
            ocppVersion={ocppVersion}
            // The backend refuses a second concurrent update (at most one may be
            // unfinished per charge point); disabling the trigger says so before
            // the installer fills a form that would be rejected.
            updateInProgress={firmware.active !== null}
            onStarted={() => void load(false)}
          />
        </>
      )}
    </div>
  );
};

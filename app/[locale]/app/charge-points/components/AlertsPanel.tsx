"use client";

import { Alert, AlertType } from "@watchborne/charge-points-types";
import { Button, Switch } from "@watchborne/electrons";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Download,
  Shield,
  ShieldAlert,
  UserCheck,
  WifiOff,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { useDateFormat } from "@/lib/date-format";
import type { ChargePoint } from "@/types/charge-point";

import { AlertStatusBadge } from "../../components/charge-points/AlertStatusBadge";

/**
 * The fields this panel reads off `Alert`, narrow enough for both
 * `AlertsPanelContainer`'s fetch and the marketing preview's literals.
 * Timestamps accept `Date | string` (only passed to `new Date`); absent and
 * `null` acknowledgment fields both mean nobody has taken the alert on.
 */
export type AlertListEntry = Pick<
  Alert,
  "id" | "type" | "status" | "connectorId" | "notificationCount"
> & {
  openedAt: Date | string;
  resolvedAt: Date | string | null;
  lastNotifiedAt: Date | string | null;
  notifiedRecipients: { email: string }[];
  acknowledgedAt?: Date | string | null;
  acknowledgedBy?: { email: string } | null;
};

type AlertsPanelProps = {
  chargePointName: ChargePoint["name"];
  realtimeAlertsEnabled: ChargePoint["realtimeAlertsEnabled"];
  onToggleRealtimeAlerts: () => void;
  alerts: AlertListEntry[];
  /** Acknowledges one alert. Omitted for a read-only list: no button. */
  onAcknowledge?: (alertId: AlertListEntry["id"]) => void;
  /** The alert whose acknowledgment is currently in flight, if any. */
  acknowledgingAlertId?: AlertListEntry["id"] | null;
  /** Exports the history as CSV. Omitted for a read-only list: no button. */
  onExportCsv?: () => void;
  exporting?: boolean;
};

const TYPE_ICON: Record<AlertType, typeof WifiOff> = {
  OFFLINE: WifiOff,
  // Same icon as ConnectorStatusIcon's Faulted.
  CONNECTOR_FAULTED: Shield,
  // Same icon as FirmwareTimeline's stalled indicator.
  FIRMWARE_STALLED: AlertTriangle,
  // Stuck Unavailable has not faulted, so not CONNECTOR_FAULTED's Shield.
  CONNECTOR_STUCK_UNAVAILABLE: Ban,
  // One-shot, unlike FIRMWARE_STALLED's in-flight AlertTriangle.
  FIRMWARE_UPDATE_FAILED: XCircle,
  SECURITY_EVENT: ShieldAlert,
};

/**
 * A charge point's alert history: each alert, whether it notified anyone, who
 * and when, and for an open alert the acknowledge action (silences
 * re-notification without resolving) and who took it. Also hosts the
 * real-time alerts opt-in (`realtimeAlertsEnabled`).
 *
 * Presentational: `AlertsPanelContainer` owns the fetch and the loading/error
 * states, so the marketing preview can render it with static data.
 */
export const AlertsPanel = ({
  chargePointName,
  realtimeAlertsEnabled,
  onToggleRealtimeAlerts,
  alerts,
  onAcknowledge,
  acknowledgingAlertId = null,
  onExportCsv,
  exporting = false,
}: AlertsPanelProps) => {
  const t = useTranslations("");
  const { formatRelative, formatDateTime } = useDateFormat();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{t("appPage.chargePoints.alerts.title")}</h4>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            {t("appPage.chargePoints.alerts.realtimeToggle")}
            <Switch
              checked={realtimeAlertsEnabled}
              onCheckedChange={onToggleRealtimeAlerts}
              aria-label={`Toggle real-time alerts for ${chargePointName}`}
            />
          </label>
          {onExportCsv && (
            <Button
              variant="outline"
              size="sm"
              loading={exporting}
              onClick={onExportCsv}
              aria-label={t("common.exportCsv")}
              title={t("common.exportCsv")}
            >
              {!exporting && <Download className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>

      {alerts.length === 0 && (
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.alerts.empty")}
        </span>
      )}

      {alerts.length > 0 && (
        <div className="divide-y rounded-md border">
          {alerts.map((alert) => {
            const TypeIcon = TYPE_ICON[alert.type];
            const recipientEmails = alert.notifiedRecipients.map((recipient) => recipient.email);
            const acknowledged = Boolean(alert.acknowledgedAt);
            // Only an OPEN alert can be taken on: the backend answers 409 on a
            // RESOLVED one.
            const acknowledgeable =
              alert.status === "OPEN" && !acknowledged && Boolean(onAcknowledge);

            return (
              <div key={alert.id} className="flex flex-col gap-2.5 px-3 py-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm font-medium flex-wrap">
                    <TypeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {t(`appPage.chargePoints.alerts.types.${alert.type}`)}
                    {alert.connectorId !== null && (
                      <div className="text-xs font-normal text-muted-foreground">
                        {t("appPage.chargePoints.alerts.connector", {
                          connectorId: alert.connectorId,
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertStatusBadge status={alert.status} />
                    {acknowledgeable && (
                      // Deliberate copy: the label says "mark as resolved" but
                      // the call only acknowledges (the alert stays OPEN). This
                      // is a product decision; don't rename the action.
                      <Button
                        variant="outline"
                        size="sm"
                        loading={acknowledgingAlertId === alert.id}
                        onClick={() => onAcknowledge?.(alert.id)}
                      >
                        {t("appPage.chargePoints.alerts.acknowledge")}
                      </Button>
                    )}
                  </div>
                </div>

                {acknowledged && (
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                    <UserCheck className="h-3.5 w-3.5 shrink-0" />
                    <span className="break-words">
                      {t("appPage.chargePoints.alerts.acknowledgedBy", {
                        email: alert.acknowledgedBy?.email ?? "",
                      })}
                    </span>
                    {alert.acknowledgedAt && <span>· {formatRelative(alert.acknowledgedAt)}</span>}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground mt-1.5">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>
                    {alert.status === "OPEN"
                      ? t("appPage.chargePoints.alerts.openedAt", {
                          date: formatRelative(alert.openedAt),
                        })
                      : t("appPage.chargePoints.alerts.resolvedAt", {
                          date: formatRelative(alert.resolvedAt ?? alert.openedAt),
                        })}
                  </span>
                  <span>({formatDateTime(alert.openedAt)})</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
                  {alert.notificationCount > 0 && alert.lastNotifiedAt ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-status-available-foreground" />
                      <span className="font-medium break-words">
                        {t("appPage.chargePoints.alerts.notifiedTo", {
                          emails: recipientEmails.join(", "),
                        })}
                      </span>
                      <span className="text-muted-foreground">
                        · {formatRelative(alert.lastNotifiedAt)}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {t("appPage.chargePoints.alerts.notNotified")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

"use client";

import { Alert, AlertType } from "@watchborne/charge-points-types";
import { Button, Switch } from "@watchborne/electrons";
import { format, formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Loader2,
  Shield,
  ShieldAlert,
  UserCheck,
  WifiOff,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { ChargePoint } from "@/types/charge-point";

import { AlertStatusBadge } from "../../components/charge-points/AlertStatusBadge";

/**
 * The fields this panel actually reads off `Alert` — narrow enough that
 * `AlertsPanelContainer`'s real fetch and a caller supplying plain literals
 * (the marketing site's product preview) both satisfy it without either one
 * fabricating the full domain shape from `@watchborne/charge-points-types`.
 * `openedAt`/`resolvedAt`/`lastNotifiedAt` accept `Date | string` since the
 * shared package's own timestamp type is irrelevant here — this panel only
 * ever wraps them in `new Date(...)`, which accepts both.
 *
 * `acknowledgedAt`/`acknowledgedBy` are optional rather than required for the
 * same reason: a caller with static fixtures and no acknowledgment to show
 * (the marketing preview) shouldn't have to spell out two nulls. Absent and
 * `null` both mean "nobody has taken this one on".
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
  /**
   * Acknowledges one alert. Optional: a caller rendering a static, read-only
   * list (the marketing preview) passes nothing and gets no action at all,
   * rather than a button that would do nothing.
   */
  onAcknowledge?: (alertId: AlertListEntry["id"]) => void;
  /** The alert whose acknowledgment is currently in flight, if any. */
  acknowledgingAlertId?: AlertListEntry["id"] | null;
};

const TYPE_ICON: Record<AlertType, typeof WifiOff> = {
  OFFLINE: WifiOff,
  // Mirrors ConnectorStatusIcon's Faulted icon — the same condition read the
  // same way wherever it appears.
  CONNECTOR_FAULTED: Shield,
  // Mirrors FirmwareTimeline's isStalled indicator.
  FIRMWARE_STALLED: AlertTriangle,
  // Distinct from CONNECTOR_FAULTED's Shield — a connector stuck Unavailable
  // hasn't faulted, it just never came back.
  CONNECTOR_STUCK_UNAVAILABLE: Ban,
  // One-shot, point-in-time (ADR 0013) — distinct from FIRMWARE_STALLED's
  // AlertTriangle, which reads as still in-flight.
  FIRMWARE_UPDATE_FAILED: XCircle,
  // One-shot too (ADR 0013) — distinct from CONNECTOR_FAULTED's plain Shield,
  // since this is the "something to actually worry about" security signal.
  SECURITY_EVENT: ShieldAlert,
};

/**
 * The alerting section of a charge point's detail panel: recent OFFLINE /
 * CONNECTOR_FAULTED / FIRMWARE_STALLED / CONNECTOR_STUCK_UNAVAILABLE /
 * FIRMWARE_UPDATE_FAILED / SECURITY_EVENT activity, and — the "✔️ sent, to whom, when" read the
 * feature exists for — whether each one actually notified
 * anyone, who, and when. An open alert also carries the acknowledge action
 * (charge-points-server issue #530) — a human taking it on, which silences
 * re-notification without resolving it — and, once taken, names who did.
 * Also hosts the opt-in switch for the real-time
 * channel itself (`ChargePoint.realtimeAlertsEnabled`) — the alerting
 * section is where an installer already is when deciding whether this
 * station warrants paging, so the toggle lives here rather than in the
 * panel's admin header alongside `isActive`.
 *
 * Purely presentational — `AlertsPanelContainer` owns the fetch and renders
 * its own loading/error state in place of this component, so `alerts` here
 * is always the loaded list; the marketing site's product preview can render
 * this directly with static data instead of duplicating the markup. The
 * toggle's own state (`realtimeAlertsEnabled`) is owned further up, same as
 * `FirmwarePanel` receiving `firmwareVersion`/`ocppVersion` as props already.
 */
export const AlertsPanel = ({
  chargePointName,
  realtimeAlertsEnabled,
  onToggleRealtimeAlerts,
  alerts,
  onAcknowledge,
  acknowledgingAlertId = null,
}: AlertsPanelProps) => {
  const t = useTranslations("");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{t("appPage.chargePoints.alerts.title")}</h4>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          {t("appPage.chargePoints.alerts.realtimeToggle")}
          <Switch
            checked={realtimeAlertsEnabled}
            onCheckedChange={onToggleRealtimeAlerts}
            aria-label={`Toggle real-time alerts for ${chargePointName}`}
          />
        </label>
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
            // Only an alert still OPEN can be taken on: the backend 409s on a
            // RESOLVED one (a one-shot FIRMWARE_UPDATE_FAILED/SECURITY_EVENT
            // is already resolved by the time it is rendered), and
            // acknowledging twice would just re-stamp the same owner.
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
                      // Deliberate copy: the label says "mark as resolved"
                      // while the call only acknowledges — the alert stays
                      // OPEN and resolution stays tied to the triggering
                      // condition clearing (charge-points-server issue #530).
                      // That wording is the repo owner's product decision;
                      // don't "fix" it by renaming the action underneath.
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={acknowledgingAlertId === alert.id}
                        onClick={() => onAcknowledge?.(alert.id)}
                      >
                        {acknowledgingAlertId === alert.id && (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        )}
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
                    {alert.acknowledgedAt && (
                      <span>
                        ·{" "}
                        {formatDistanceToNow(new Date(alert.acknowledgedAt), {
                          addSuffix: true,
                          locale: enGB,
                        })}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground mt-1.5">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>
                    {alert.status === "OPEN"
                      ? t("appPage.chargePoints.alerts.openedAt", {
                          date: formatDistanceToNow(new Date(alert.openedAt), {
                            addSuffix: true,
                            locale: enGB,
                          }),
                        })
                      : t("appPage.chargePoints.alerts.resolvedAt", {
                          date: formatDistanceToNow(new Date(alert.resolvedAt ?? alert.openedAt), {
                            addSuffix: true,
                            locale: enGB,
                          }),
                        })}
                  </span>
                  <span>({format(new Date(alert.openedAt), "dd/MM/yyyy HH:mm")})</span>
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
                        ·{" "}
                        {formatDistanceToNow(new Date(alert.lastNotifiedAt), {
                          addSuffix: true,
                          locale: enGB,
                        })}
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

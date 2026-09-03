"use client";

import { Alert, AlertType } from "@watchborne/charge-points-types";
import { Callout, Switch } from "@watchborne/electrons";
import { format, formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Shield,
  ShieldAlert,
  WifiOff,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { ChargePoint } from "@/types/charge-point";

import { AlertStatusBadge } from "../../components/charge-points/AlertStatusBadge";

type AlertsPanelProps = {
  chargePointId: ChargePoint["id"];
  chargePointName: ChargePoint["name"];
  realtimeAlertsEnabled: ChargePoint["realtimeAlertsEnabled"];
  onToggleRealtimeAlerts: () => void;
};

/** How many recent alerts (open or resolved) the panel shows — a glance at
 * recent activity, not a full audit log (`api.ChargePoints.getAlerts`
 * supports a much longer history if a fuller browser is ever built). */
const VISIBLE_ALERT_COUNT = 5;

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
 * anyone, who, and when. Also hosts the opt-in switch for the real-time
 * channel itself (`ChargePoint.realtimeAlertsEnabled`) — the alerting
 * section is where an installer already is when deciding whether this
 * station warrants paging, so the toggle lives here rather than in the
 * panel's admin header alongside `isActive`.
 *
 * The alert list itself is self-contained and fetch-once, like
 * `ChargePointConsumptionPanel`: unlike `FirmwarePanel` there is no
 * dedicated WebSocket broadcast for alert changes yet, so this does not
 * subscribe to the dashboard socket. The toggle's own state
 * (`realtimeAlertsEnabled`) is owned by the parent, same as `FirmwarePanel`
 * receiving `firmwareVersion`/`ocppVersion` as props already.
 */
export const AlertsPanel = ({
  chargePointId,
  chargePointName,
  realtimeAlertsEnabled,
  onToggleRealtimeAlerts,
}: AlertsPanelProps) => {
  const t = useTranslations("");

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Reset before refetching so a different station's alerts are never shown
    // under this one's name while the request is in flight.
    setAlerts([]);
    setLoading(true);
    setFailed(false);

    void (async () => {
      try {
        const result = await api.ChargePoints.getAlerts(chargePointId, VISIBLE_ALERT_COUNT);
        if (!cancelled) setAlerts(result);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chargePointId]);

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

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 animate-pulse" />
          {t("appPage.chargePoints.alerts.loading")}
        </div>
      )}

      {!loading && failed && (
        <Callout description={t("appPage.chargePoints.alerts.loadError")} variant="error" />
      )}

      {!loading && !failed && alerts.length === 0 && (
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.alerts.empty")}
        </span>
      )}

      {!loading && !failed && alerts.length > 0 && (
        <div className="divide-y rounded-md border">
          {alerts.map((alert) => {
            const TypeIcon = TYPE_ICON[alert.type];
            const recipientEmails = alert.notifiedRecipients.map((recipient) => recipient.email);

            return (
              <div key={alert.id} className="flex flex-col gap-1.5 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <TypeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {t(`appPage.chargePoints.alerts.types.${alert.type}`)}
                    {alert.connectorId !== null && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {t("appPage.chargePoints.alerts.connector", {
                          connectorId: alert.connectorId,
                        })}
                      </span>
                    )}
                  </span>
                  <AlertStatusBadge status={alert.status} />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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

                <div className="flex items-center gap-1.5 text-xs">
                  {alert.notificationCount > 0 && alert.lastNotifiedAt ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-status-available-foreground" />
                      <span className="font-medium">
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

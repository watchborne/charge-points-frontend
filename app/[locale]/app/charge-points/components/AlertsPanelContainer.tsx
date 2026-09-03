"use client";

import { Callout } from "@watchborne/electrons";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { ChargePoint } from "@/types/charge-point";

import { AlertsPanel, type AlertListEntry } from "./AlertsPanel";

/** How many recent alerts (open or resolved) the panel shows — a glance at
 * recent activity, not a full audit log (`api.ChargePoints.getAlerts`
 * supports a much longer history if a fuller browser is ever built). */
const VISIBLE_ALERT_COUNT = 5;

type AlertsPanelContainerProps = {
  chargePointId: ChargePoint["id"];
  chargePointName: ChargePoint["name"];
  realtimeAlertsEnabled: ChargePoint["realtimeAlertsEnabled"];
  onToggleRealtimeAlerts: () => void;
};

/**
 * Fetches one charge point's alert history and hands it to `AlertsPanel` —
 * the data-owning half of that container/presentational split. Also owns the
 * loading/error templates, so `AlertsPanel` only ever renders the loaded
 * list. Self-contained and fetch-once, like
 * `ChargePointConsumptionPanelContainer`: unlike `FirmwarePanel` there is no
 * dedicated WebSocket broadcast for alert changes yet, so this does not
 * subscribe to the dashboard socket.
 */
export const AlertsPanelContainer = ({
  chargePointId,
  chargePointName,
  realtimeAlertsEnabled,
  onToggleRealtimeAlerts,
}: AlertsPanelContainerProps) => {
  const t = useTranslations("");

  const [alerts, setAlerts] = useState<AlertListEntry[]>([]);
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

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4 animate-pulse" />
        {t("appPage.chargePoints.alerts.loading")}
      </div>
    );
  }

  if (failed) {
    return <Callout description={t("appPage.chargePoints.alerts.loadError")} variant="error" />;
  }

  return (
    <AlertsPanel
      chargePointName={chargePointName}
      realtimeAlertsEnabled={realtimeAlertsEnabled}
      onToggleRealtimeAlerts={onToggleRealtimeAlerts}
      alerts={alerts}
    />
  );
};

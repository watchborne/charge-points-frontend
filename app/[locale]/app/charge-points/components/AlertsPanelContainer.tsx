"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Callout } from "@watchborne/electrons";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";

import { AlertsPanel } from "./AlertsPanel";

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
 *
 * Also owns the one write this panel has — acknowledging an alert — as a
 * mutation that invalidates the list it just changed, the same shape
 * `useChargePoints`' own mutations use.
 */
export const AlertsPanelContainer = ({
  chargePointId,
  chargePointName,
  realtimeAlertsEnabled,
  onToggleRealtimeAlerts,
}: AlertsPanelContainerProps) => {
  const t = useTranslations("");
  const queryClient = useQueryClient();

  const {
    data: alerts = [],
    isLoading: loading,
    isError: failed,
  } = useQuery({
    queryKey: queryKeys.alerts.chargePoint(chargePointId),
    queryFn: () => api.ChargePoints.getAlerts(chargePointId, VISIBLE_ALERT_COUNT),
  });

  const {
    mutate: acknowledge,
    isPending: acknowledging,
    isError: acknowledgeFailed,
    variables: acknowledgingAlertId,
  } = useMutation({
    mutationFn: (alertId: string) => api.ChargePoints.acknowledgeAlert(chargePointId, alertId),
    // Invalidate rather than write the returned alert into the cache by hand:
    // the list is capped and ordered server-side, so refetching is the one
    // read that cannot drift from what the backend would answer next.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.chargePoint(chargePointId) }),
  });

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
    <div className="flex flex-col gap-3">
      {acknowledgeFailed && (
        <Callout description={t("appPage.chargePoints.alerts.acknowledgeError")} variant="error" />
      )}

      <AlertsPanel
        chargePointName={chargePointName}
        realtimeAlertsEnabled={realtimeAlertsEnabled}
        onToggleRealtimeAlerts={onToggleRealtimeAlerts}
        alerts={alerts}
        onAcknowledge={acknowledge}
        acknowledgingAlertId={acknowledging ? (acknowledgingAlertId ?? null) : null}
      />
    </div>
  );
};

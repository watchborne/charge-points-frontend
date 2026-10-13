"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Callout } from "@watchborne/electrons";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";

import { api } from "@/lib/api";
import { csvFilenameDate, downloadCsv } from "@/lib/csv";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";

import { AlertsPanel } from "./AlertsPanel";

/** How many recent alerts (open or resolved) the panel shows — a glance at
 * recent activity, not a full audit log (`api.ChargePoints.getAlerts`
 * supports a much longer history if a fuller browser is ever built). */
const VISIBLE_ALERT_COUNT = 5;

/** How far back the CSV export reaches — the panel only shows the latest few. */
const EXPORT_ALERT_COUNT = 100;

// `getAlerts` is typed with the package's `Date`s but hands over parsed JSON,
// i.e. ISO strings; normalizing covers both.
const toIso = (date: Date | string | null): string | null =>
  date ? new Date(date).toISOString() : null;

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

  const {
    mutate: exportCsv,
    isPending: exporting,
    isError: exportFailed,
  } = useMutation({
    // Fetched on click rather than from the list above: that one is capped at
    // `VISIBLE_ALERT_COUNT`, which would make for a pointless export.
    mutationFn: () => api.ChargePoints.getAlerts(chargePointId, EXPORT_ALERT_COUNT),
    onSuccess: (history) =>
      downloadCsv(`alerts-${chargePointName}-${csvFilenameDate()}.csv`, [
        [
          t("appPage.chargePoints.alerts.export.type"),
          t("appPage.chargePoints.alerts.export.connector"),
          t("appPage.chargePoints.alerts.export.status"),
          t("appPage.chargePoints.alerts.export.openedAt"),
          t("appPage.chargePoints.alerts.export.resolvedAt"),
          t("appPage.chargePoints.alerts.export.notifiedTo"),
          t("appPage.chargePoints.alerts.export.lastNotifiedAt"),
          t("appPage.chargePoints.alerts.export.acknowledgedBy"),
          t("appPage.chargePoints.alerts.export.acknowledgedAt"),
        ],
        ...history.map((alert) => [
          alert.type,
          alert.connectorId,
          alert.status,
          toIso(alert.openedAt),
          toIso(alert.resolvedAt),
          alert.notifiedRecipients.map((recipient) => recipient.email).join("; "),
          toIso(alert.lastNotifiedAt),
          alert.acknowledgedBy?.email,
          toIso(alert.acknowledgedAt),
        ]),
      ]),
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

      {exportFailed && (
        <Callout description={t("appPage.chargePoints.alerts.export.error")} variant="error" />
      )}

      <AlertsPanel
        chargePointName={chargePointName}
        realtimeAlertsEnabled={realtimeAlertsEnabled}
        onToggleRealtimeAlerts={onToggleRealtimeAlerts}
        alerts={alerts}
        onAcknowledge={acknowledge}
        acknowledgingAlertId={acknowledging ? (acknowledgingAlertId ?? null) : null}
        onExportCsv={() => exportCsv()}
        exporting={exporting}
      />
    </div>
  );
};

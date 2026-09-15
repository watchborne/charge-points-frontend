"use client";

import { useQuery } from "@tanstack/react-query";
import { Callout } from "@watchborne/electrons";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";

import { ChargingSessionsPanel } from "./ChargingSessionsPanel";

/** A glance at recent activity, not a full audit log — same role
 * `VISIBLE_HISTORY_COUNT` plays for `LogUploadPanel`, scaled up: a session
 * opens on every plug-in, far more often than a log upload. */
const VISIBLE_HISTORY_COUNT = 20;

type ChargingSessionsPanelContainerProps = {
  chargePointId: ChargePoint["id"];
};

/**
 * Fetches one charge point's charging-session history and hands it to
 * `ChargingSessionsPanel` — the data-owning half of that
 * container/presentational split. Also owns the loading/error templates, so
 * `ChargingSessionsPanel` only ever renders the loaded list. Self-contained
 * and fetch-once, like `AlertsPanelContainer`/`SecurityEventsPanel`/
 * `LogUploadPanel`: there is no dedicated WebSocket broadcast for this yet.
 */
export const ChargingSessionsPanelContainer = ({
  chargePointId,
}: ChargingSessionsPanelContainerProps) => {
  const t = useTranslations("");

  const {
    data: sessions = [],
    isLoading: loading,
    isError: failed,
  } = useQuery({
    queryKey: queryKeys.chargingSessions.chargePoint(chargePointId),
    queryFn: () => api.ChargePoints.listChargingSessions(chargePointId, VISIBLE_HISTORY_COUNT),
  });

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("appPage.chargePoints.chargingSessions.loading")}
      </div>
    );
  }

  if (failed) {
    return (
      <Callout description={t("appPage.chargePoints.chargingSessions.loadError")} variant="error" />
    );
  }

  return <ChargingSessionsPanel chargePointId={chargePointId} sessions={sessions} />;
};

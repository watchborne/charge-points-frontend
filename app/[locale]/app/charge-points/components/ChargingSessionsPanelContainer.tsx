"use client";

import { useQuery } from "@tanstack/react-query";
import { Callout } from "@watchborne/electrons";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";

import { ChargingSessionCostCell } from "./ChargingSessionCostCell";
import { ChargingSessionsPanel } from "./ChargingSessionsPanel";

/** Recent sessions only; one opens on every plug-in. */
const VISIBLE_HISTORY_COUNT = 20;

type ChargingSessionsPanelContainerProps = {
  chargePointId: ChargePoint["id"];
};

/**
 * Fetches one charge point's sessions for `ChargingSessionsPanel` and owns the
 * loading/error states. Fetch-once: no WebSocket broadcast for sessions.
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

  return (
    <ChargingSessionsPanel
      chargePointId={chargePointId}
      sessions={sessions}
      renderCost={(session) => (
        <ChargingSessionCostCell chargePointId={chargePointId} session={session} />
      )}
    />
  );
};

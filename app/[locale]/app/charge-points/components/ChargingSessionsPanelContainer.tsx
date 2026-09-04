"use client";

import { Callout } from "@watchborne/electrons";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { ChargePoint } from "@/types/charge-point";

import { ChargingSessionsPanel, type ChargingSessionListEntry } from "./ChargingSessionsPanel";

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

  const [sessions, setSessions] = useState<ChargingSessionListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      const recent = await api.ChargePoints.listChargingSessions(
        chargePointId,
        VISIBLE_HISTORY_COUNT,
      );
      setSessions(recent);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [chargePointId]);

  useEffect(() => {
    // Reset before refetching so a different station's sessions are never
    // shown under this one while the request is in flight.
    setSessions([]);
    setLoading(true);
    void load();
  }, [load]);

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

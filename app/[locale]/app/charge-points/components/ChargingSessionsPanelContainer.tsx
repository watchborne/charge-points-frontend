"use client";

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
 * container/presentational split. Self-contained and fetch-once, like
 * `AlertsPanelContainer`/`SecurityEventsPanel`/`LogUploadPanel`: there is no
 * dedicated WebSocket broadcast for this yet.
 */
export const ChargingSessionsPanelContainer = ({
  chargePointId,
}: ChargingSessionsPanelContainerProps) => {
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

  return <ChargingSessionsPanel sessions={sessions} loading={loading} failed={failed} />;
};

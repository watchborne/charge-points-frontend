import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback, useRef } from "react";

import { api } from "@/lib/api";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { useWebSocketContext } from "./useWebSocketContext";

export interface UseChargePointsReturn {
  chargePoints: ChargePointWithConnectors[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useChargePoints(): UseChargePointsReturn {
  const t = useTranslations("");
  const [chargePoints, setChargePoints] = useState<ChargePointWithConnectors[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { lastMessage, status } = useWebSocketContext();
  const hasConnectedRef = useRef(false);

  const loadChargePoints = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await api.ChargePoints.getChargePoints();
      setChargePoints(data);
    } catch (err) {
      setError(t("errors.loadingChargePoints"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetchSilently = useCallback(async () => {
    try {
      const data = await api.ChargePoints.getChargePoints();
      setChargePoints(data);
    } catch (err) {
      console.error("Failed to refetch charge points:", err);
    }
  }, []);

  useEffect(() => {
    if (lastMessage?.type !== "CHARGE_POINT_MONITORING") return;
    const incoming = lastMessage.payload?.chargePoint as ChargePointWithConnectors | undefined;
    if (!incoming) return;
    setChargePoints((prev) => {
      const idx = prev.findIndex((cp) => cp.id === incoming.id);
      if (idx === -1) return [...prev, incoming];
      const next = [...prev];
      next[idx] = incoming;
      return next;
    });
  }, [lastMessage]);

  useEffect(() => {
    loadChargePoints();
  }, [loadChargePoints]);

  // Le WebSocket ne rejoue pas les événements manqués pendant une coupure : on
  // resynchronise via un refetch REST à chaque reconnexion (mais pas à la
  // toute première connexion, déjà couverte par le fetch initial ci-dessus).
  // Use refetchSilently instead of loadChargePoints to avoid showing the loading
  // state, which causes visual flicker on dashboard reconnections.
  useEffect(() => {
    if (status !== "CONNECTED") return;
    if (hasConnectedRef.current) {
      void refetchSilently();
    }
    hasConnectedRef.current = true;
  }, [status, refetchSilently]);

  return {
    chargePoints,
    loading,
    error,
    refetch: loadChargePoints,
  };
}

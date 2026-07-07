import { useEffect, useState, useCallback } from "react";

import { api } from "@/lib/api";
import { ChargePoint } from "@/types/charge-point";

import { useWebSocketContext } from "./useWebSocketContext";

export interface UseChargePointsReturn {
  chargePoints: ChargePoint[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useChargePoints(): UseChargePointsReturn {
  const [chargePoints, setChargePoints] = useState<ChargePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { lastMessage } = useWebSocketContext();

  const loadChargePoints = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await api.ChargePoints.getChargePoints();
      setChargePoints(data);
    } catch (err) {
      setError(
        "Impossible de charger les bornes. Vérifiez que le backend tourne sur http://localhost:3000",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (lastMessage?.type !== "CHARGE_POINT_MONITORING") return;
    const incoming = lastMessage.payload?.chargePoint as ChargePoint | undefined;
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

  return {
    chargePoints,
    loading,
    error,
    refetch: loadChargePoints,
  };
}

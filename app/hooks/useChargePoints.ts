import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { ChargePoint, ChargePointConnectionStatus } from "@/types/charge-point";
import { useWebSocketContext } from "./useWebSocketContext";
import { OcppAction } from "@/types/ocpp";

export interface UseChargePointsReturn {
  chargePoints: ChargePoint[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

type WebSocketMessage = {
  chargePointId: string;
  payload: {
    chargePoint?: ChargePoint;
    event: ChargePointConnectionStatus | OcppAction;
  };
};

export function useChargePoints(): UseChargePointsReturn {
  const [chargePoints, setChargePoints] = useState<ChargePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { lastMessage } = useWebSocketContext();

  const loadChargePoints = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await api.getChargePoints();
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
    if (lastMessage?.type === "OCPP") {
      try {
        loadChargePoints();
      } catch (err) {
        console.error("Failed to handle WebSocket message:", err);
      }
    }
  }, [lastMessage, loadChargePoints]);

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

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { ChargePoint } from "@/types";

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
    loadChargePoints();
  }, [loadChargePoints]);

  return {
    chargePoints,
    loading,
    error,
    refetch: loadChargePoints,
  };
}

import type { AvailabilityType, ChargePoint, ResetType } from "@watchborne/charge-points-types";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface ChargePointActions {
  toggleActive: () => Promise<void>;
  toggleRealtimeAlerts: () => Promise<void>;
  edit: () => void;
  delete: () => void;
  reset: (type: ResetType) => Promise<void>;
  changeAvailability: (connectorId: number, type: AvailabilityType) => Promise<void>;
  unlockConnector: (connectorId: number) => Promise<void>;
}

interface UseChargePointActionsProps {
  chargePointId: ChargePoint["id"];
  currentChargePoint: ChargePoint | null;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export function useChargePointActions({
  chargePointId,
  currentChargePoint,
  onEditClick,
  onDeleteClick,
}: UseChargePointActionsProps): ChargePointActions {
  const queryClient = useQueryClient();

  const toggleActive = useCallback(async () => {
    if (!currentChargePoint) return;
    try {
      await api.ChargePoints.updateChargePoint(chargePointId, {
        isActive: !currentChargePoint.isActive,
      });
      queryClient.invalidateQueries({ queryKey: ["chargePoints"] });
    } catch (error) {
      console.error("Failed to toggle charge point active state", error);
      throw error;
    }
  }, [chargePointId, currentChargePoint, queryClient]);

  const toggleRealtimeAlerts = useCallback(async () => {
    if (!currentChargePoint) return;
    try {
      await api.ChargePoints.updateChargePoint(chargePointId, {
        realtimeAlertsEnabled: !currentChargePoint.realtimeAlertsEnabled,
      });
      queryClient.invalidateQueries({ queryKey: ["chargePoints"] });
    } catch (error) {
      console.error("Failed to toggle realtime alerts", error);
      throw error;
    }
  }, [chargePointId, currentChargePoint, queryClient]);

  const reset = useCallback(
    async (type: ResetType) => {
      try {
        await api.ChargePoints.resetChargePoint(chargePointId, type);
        queryClient.invalidateQueries({ queryKey: ["chargePoints"] });
      } catch (error) {
        console.error("Failed to reset charge point", error);
        throw error;
      }
    },
    [chargePointId, queryClient],
  );

  const changeAvailability = useCallback(
    async (connectorId: number, type: AvailabilityType) => {
      try {
        await api.ChargePoints.changeAvailability(chargePointId, connectorId, type);
        queryClient.invalidateQueries({ queryKey: ["chargePoints"] });
      } catch (error) {
        console.error("Failed to change availability", error);
        throw error;
      }
    },
    [chargePointId, queryClient],
  );

  const unlockConnector = useCallback(
    async (connectorId: number) => {
      try {
        await api.ChargePoints.unlockConnector(chargePointId, connectorId);
        queryClient.invalidateQueries({ queryKey: ["chargePoints"] });
      } catch (error) {
        console.error("Failed to unlock connector", error);
        throw error;
      }
    },
    [chargePointId, queryClient],
  );

  return {
    toggleActive,
    toggleRealtimeAlerts,
    edit: onEditClick,
    delete: onDeleteClick,
    reset,
    changeAvailability,
    unlockConnector,
  };
}

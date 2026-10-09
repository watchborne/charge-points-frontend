import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AvailabilityType, ResetType } from "@watchborne/charge-points-types";
import type { ChargePoint } from "@watchborne/charge-points-types";
import { useCallback, useEffect } from "react";

import { api } from "@/lib/api";
import type {
  ChangeAvailabilityOutcome,
  ResetChargePointOutcome,
  UnlockConnectorOutcome,
} from "@/lib/api-charge-points";
import { queryKeys } from "@/lib/queryKeys";

export interface ChargePointActions {
  toggleActive: () => void;
  toggleRealtimeAlerts: () => void;
  /** True once the last active/real-time-alerts toggle failed, until the next attempt. */
  toggleError: boolean;
  edit: () => void;
  delete: () => void;
  reset: (type: ResetType) => Promise<ResetChargePointOutcome>;
  changeAvailability: (
    connectorId: number,
    type: AvailabilityType,
  ) => Promise<ChangeAvailabilityOutcome>;
  unlockConnector: (connectorId: number) => Promise<UnlockConnectorOutcome>;
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

  // Mutations rather than bare awaited calls: updateChargePoint throws on any
  // non-2xx, and a fire-and-forget caller would turn that into an unhandled
  // rejection with no feedback. `isError` lets the panel say the toggle failed.
  const updateMutation = useMutation({
    mutationFn: (body: Parameters<typeof api.ChargePoints.updateChargePoint>[1]) =>
      api.ChargePoints.updateChargePoint(chargePointId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chargePoints.all() });
    },
  });
  const { mutate: update, reset: resetUpdate } = updateMutation;

  // A failure belongs to the station it happened on, not the next one opened.
  useEffect(() => {
    resetUpdate();
  }, [chargePointId, resetUpdate]);

  const toggleActive = useCallback(() => {
    if (!currentChargePoint) return;
    update({ isActive: !currentChargePoint.isActive });
  }, [currentChargePoint, update]);

  const toggleRealtimeAlerts = useCallback(() => {
    if (!currentChargePoint) return;
    update({ realtimeAlertsEnabled: !currentChargePoint.realtimeAlertsEnabled });
  }, [currentChargePoint, update]);

  // reset/changeAvailability/unlockConnector are OCPP request/response
  // commands: `api.ChargePoints` already catches every failure (including a
  // thrown network error) and resolves with a discriminated outcome rather
  // than rejecting, so the caller can show the specific reason (offline,
  // rejected, timed out) rather than a generic error.
  const reset = useCallback(
    async (type: ResetType) => {
      const outcome = await api.ChargePoints.resetChargePoint(chargePointId, type);
      queryClient.invalidateQueries({ queryKey: queryKeys.chargePoints.all() });
      return outcome;
    },
    [chargePointId, queryClient],
  );

  const changeAvailability = useCallback(
    async (connectorId: number, type: AvailabilityType) => {
      const outcome = await api.ChargePoints.changeAvailability(chargePointId, connectorId, type);
      queryClient.invalidateQueries({ queryKey: queryKeys.chargePoints.all() });
      return outcome;
    },
    [chargePointId, queryClient],
  );

  const unlockConnector = useCallback(
    async (connectorId: number) => {
      const outcome = await api.ChargePoints.unlockConnector(chargePointId, connectorId);
      queryClient.invalidateQueries({ queryKey: queryKeys.chargePoints.all() });
      return outcome;
    },
    [chargePointId, queryClient],
  );

  return {
    toggleActive,
    toggleRealtimeAlerts,
    toggleError: updateMutation.isError,
    edit: onEditClick,
    delete: onDeleteClick,
    reset,
    changeAvailability,
    unlockConnector,
  };
}

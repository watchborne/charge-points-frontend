import { useQueryClient } from "@tanstack/react-query";
import type { AvailabilityType, ResetType } from "@watchborne/charge-points-types";
import type { ChargePoint } from "@watchborne/charge-points-types";
import { useCallback } from "react";

import { api } from "@/lib/api";
import type {
  ChangeAvailabilityOutcome,
  ResetChargePointOutcome,
  UnlockConnectorOutcome,
} from "@/lib/api-charge-points";
import { queryKeys } from "@/lib/queryKeys";

export interface ChargePointActions {
  toggleActive: () => Promise<void>;
  toggleRealtimeAlerts: () => Promise<void>;
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

  // Prefix match: invalidating queryKeys.audit.all() covers both this
  // station's Activity tab and the platform-wide /app/activity page.
  const invalidateAudit = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.audit.all() });
  }, [queryClient]);

  const toggleActive = useCallback(async () => {
    if (!currentChargePoint) return;
    await api.ChargePoints.updateChargePoint(chargePointId, {
      isActive: !currentChargePoint.isActive,
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.chargePoints.all() });
    invalidateAudit();
  }, [chargePointId, currentChargePoint, queryClient, invalidateAudit]);

  const toggleRealtimeAlerts = useCallback(async () => {
    if (!currentChargePoint) return;
    await api.ChargePoints.updateChargePoint(chargePointId, {
      realtimeAlertsEnabled: !currentChargePoint.realtimeAlertsEnabled,
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.chargePoints.all() });
    invalidateAudit();
  }, [chargePointId, currentChargePoint, queryClient, invalidateAudit]);

  // reset/changeAvailability/unlockConnector are OCPP request/response
  // commands: `api.ChargePoints` already catches every failure (including a
  // thrown network error) and resolves with a discriminated outcome rather
  // than rejecting, so the caller can show the specific reason (offline,
  // rejected, timed out) rather than a generic error.
  const reset = useCallback(
    async (type: ResetType) => {
      const outcome = await api.ChargePoints.resetChargePoint(chargePointId, type);
      queryClient.invalidateQueries({ queryKey: queryKeys.chargePoints.all() });
      invalidateAudit();
      return outcome;
    },
    [chargePointId, queryClient, invalidateAudit],
  );

  const changeAvailability = useCallback(
    async (connectorId: number, type: AvailabilityType) => {
      const outcome = await api.ChargePoints.changeAvailability(chargePointId, connectorId, type);
      queryClient.invalidateQueries({ queryKey: queryKeys.chargePoints.all() });
      invalidateAudit();
      return outcome;
    },
    [chargePointId, queryClient, invalidateAudit],
  );

  const unlockConnector = useCallback(
    async (connectorId: number) => {
      const outcome = await api.ChargePoints.unlockConnector(chargePointId, connectorId);
      queryClient.invalidateQueries({ queryKey: queryKeys.chargePoints.all() });
      invalidateAudit();
      return outcome;
    },
    [chargePointId, queryClient, invalidateAudit],
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

import { useQueryClient } from "@tanstack/react-query";
import type { AvailabilityType, ChargePoint, ResetType } from "@watchborne/charge-points-types";
import { useCallback } from "react";

import { api } from "@/lib/api";
import type {
  ChangeAvailabilityOutcome,
  ResetChargePointOutcome,
  UnlockConnectorOutcome,
} from "@/lib/api-charge-points";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePointWithConnectors } from "@/types/charge-point";

/**
 * UnlockConnector targets a connector, so a station without one can't be
 * unlocked: `"noConnector"` tells that apart from an OCPP failure.
 */
export type BulkUnlockConnectorOutcome =
  UnlockConnectorOutcome | { ok: false; reason: "noConnector" };

export interface BulkActionResult<TOutcome> {
  chargePointId: ChargePoint["id"];
  chargePointName: string;
  outcome: TOutcome;
}

export interface BulkChargePointActions {
  bulkReset: (
    chargePoints: ChargePointWithConnectors[],
    type: ResetType,
  ) => Promise<BulkActionResult<ResetChargePointOutcome>[]>;
  bulkChangeAvailability: (
    chargePoints: ChargePointWithConnectors[],
    type: AvailabilityType,
  ) => Promise<BulkActionResult<ChangeAvailabilityOutcome>[]>;
  bulkUnlockConnector: (
    chargePoints: ChargePointWithConnectors[],
  ) => Promise<BulkActionResult<BulkUnlockConnectorOutcome>[]>;
}

/**
 * Sends one OCPP command to several charge points concurrently and reports
 * each station's outcome. Commands resolve with an outcome rather than
 * rejecting, so one failure can't abort the others; the list is invalidated
 * once, after the batch.
 */
export function useBulkChargePointActions(): BulkChargePointActions {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.chargePoints.all() });
    // Prefix match: covers the per-charge-point Activity tab and /app/activity.
    queryClient.invalidateQueries({ queryKey: queryKeys.audit.all() });
  }, [queryClient]);

  const bulkReset = useCallback(
    async (chargePoints: ChargePointWithConnectors[], type: ResetType) => {
      const results = await Promise.all(
        chargePoints.map(async (chargePoint) => ({
          chargePointId: chargePoint.id,
          chargePointName: chargePoint.name,
          outcome: await api.ChargePoints.resetChargePoint(chargePoint.id, type),
        })),
      );
      invalidate();
      return results;
    },
    [invalidate],
  );

  const bulkChangeAvailability = useCallback(
    async (chargePoints: ChargePointWithConnectors[], type: AvailabilityType) => {
      const results = await Promise.all(
        chargePoints.map(async (chargePoint) => ({
          chargePointId: chargePoint.id,
          chargePointName: chargePoint.name,
          // connectorId 0 targets the whole charge point.
          outcome: await api.ChargePoints.changeAvailability(chargePoint.id, 0, type),
        })),
      );
      invalidate();
      return results;
    },
    [invalidate],
  );

  const bulkUnlockConnector = useCallback(
    async (chargePoints: ChargePointWithConnectors[]) => {
      const results = await Promise.all(
        chargePoints.map(async (chargePoint) => {
          // The first connector: bulk unlock targets single-connector
          // installations.
          const connectorId = chargePoint.connectors[0]?.connectorId;
          const outcome: BulkUnlockConnectorOutcome =
            connectorId === undefined
              ? { ok: false, reason: "noConnector" }
              : await api.ChargePoints.unlockConnector(chargePoint.id, connectorId);

          return {
            chargePointId: chargePoint.id,
            chargePointName: chargePoint.name,
            outcome,
          };
        }),
      );
      invalidate();
      return results;
    },
    [invalidate],
  );

  return { bulkReset, bulkChangeAvailability, bulkUnlockConnector };
}

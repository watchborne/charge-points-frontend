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
 * UnlockConnector targets one physical connector, unlike Reset/
 * ChangeAvailability, which act on the station as a whole. There is no
 * fleet-wide connector number to fan a bulk unlock out to, so a station with
 * no connector at all (nothing installed yet, or a filtered-out read) can't
 * be targeted — `"noConnector"` distinguishes that from an OCPP-level failure
 * so the result list can say why, instead of reporting a generic error.
 */
export type BulkUnlockConnectorOutcome =
  | UnlockConnectorOutcome
  | { ok: false; reason: "noConnector" };

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
 * Fans an OCPP command out to several charge points at once — one request per
 * station — and reports each station's own outcome rather than a single
 * pass/fail: an installer resetting ten stations needs to know which three
 * didn't take, not just that "something failed" (issue #273). Every
 * `api.ChargePoints.*` command already resolves with a discriminated outcome
 * instead of rejecting, so the whole batch runs concurrently via
 * `Promise.all` — one station's failure can't abort the others — and the
 * charge points list is invalidated once, after the batch settles, rather
 * than once per station.
 */
export function useBulkChargePointActions(): BulkChargePointActions {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.chargePoints.all() });
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
          // connectorId 0 targets the whole charge point — same convention
          // ChargePointActionsSection's single-station availability control
          // uses (see its WHOLE_CHARGE_POINT_KEY in ChargePointDetailPanel).
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
          // Targets each station's first connector — the only one on the
          // common single-connector installation this bulk action is aimed
          // at (see BulkUnlockConnectorOutcome above for the no-connector case).
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

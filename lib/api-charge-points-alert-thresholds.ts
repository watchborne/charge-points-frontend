import type {
  ChargePoint,
  ChargePointAlertThresholds as SharedChargePointAlertThresholds,
  GetChargePointAlertThresholdsResult as SharedGetChargePointAlertThresholdsResult,
  UpdateAlertThresholds,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";
import type { Wire } from "./wire";

// A charge point's own threshold overrides; `null` inherits from its site,
// then the global default.

export type ChargePointAlertThresholds = Wire<SharedChargePointAlertThresholds>;

/**
 * `thresholds` is null without overrides; `effective` is what the alert sweep
 * applies (own override, else site, else default) and where each comes from.
 */
export type GetChargePointAlertThresholdsResult = Wire<SharedGetChargePointAlertThresholdsResult>;

/** Partial update: an omitted threshold is untouched, `null` clears it. */
export type UpdateChargePointAlertThresholdsBody = UpdateAlertThresholds;

export const chargePointAlertThresholdsApis = {
  get: async function (
    chargePointId: ChargePoint["id"],
  ): Promise<GetChargePointAlertThresholdsResult> {
    return withErrorLogging(
      () =>
        httpClient.get<GetChargePointAlertThresholdsResult>(
          `/api/charge-points/${chargePointId}/alert-thresholds`,
        ),
      `ChargePointAlertThresholds.get(${chargePointId})`,
    );
  },
  update: async function (
    chargePointId: ChargePoint["id"],
    body: UpdateChargePointAlertThresholdsBody,
  ): Promise<ChargePointAlertThresholds> {
    return withErrorLogging(
      () =>
        httpClient.patch<ChargePointAlertThresholds>(
          `/api/charge-points/${chargePointId}/alert-thresholds`,
          body,
        ),
      `ChargePointAlertThresholds.update(${chargePointId})`,
    );
  },
  reset: async function (chargePointId: ChargePoint["id"]): Promise<void> {
    return withErrorLogging(
      () => httpClient.delete(`/api/charge-points/${chargePointId}/alert-thresholds`),
      `ChargePointAlertThresholds.reset(${chargePointId})`,
    );
  },
};

import type {
  ChargePoint,
  ChargePointAlertThresholds as SharedChargePointAlertThresholds,
  GetChargePointAlertThresholdsResult as SharedGetChargePointAlertThresholdsResult,
  UpdateAlertThresholds,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";
import type { Wire } from "./wire";

// A charge point's own overrides of the time-based alert thresholds: the shared
// `ChargePointAlertThresholds` entity (@watchborne/charge-points-types), as it
// looks once serialized to JSON — timestamps arrive as ISO strings (see `Wire`).
// A `null` threshold means "inherit from the charge point's site, then the global
// default" (charge-points-server issue #577, ADR 0031).

export type ChargePointAlertThresholds = Wire<SharedChargePointAlertThresholds>;

/**
 * `GET /api/charge-points/:id/alert-thresholds`'s envelope: `thresholds` is null
 * when the charge point has no overrides of its own, and `effective` is what the
 * alert sweep really applies to it (own override, else its site's, else the
 * default) with the level of each value — resolved by the backend, never guessed
 * here.
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

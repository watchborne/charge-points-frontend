import type { ChargePoint, ChargingSession } from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

/**
 * A session's estimated cost (a computation, not a shared entity).
 * `amountCents` is null exactly when `reason` is set: still `ACTIVE`, no
 * energy figure, or no site tariff. Valid answers, not errors.
 */
export type ChargingSessionCost = {
  sessionId: string;
  chargePointId: string;
  energyWh: number | null;
  currency: string | null;
  pricePerKwhCents: number | null;
  amountCents: number | null;
  reason: "SESSION_STILL_ACTIVE" | "NO_ENERGY_DATA" | "NO_TARIFF_CONFIGURED" | null;
};

export const chargingSessionApis = {
  /**
   * The charging-session history, newest first, across every connector,
   * including any `ACTIVE` session.
   */
  listChargingSessions: async function (
    chargePointId: ChargePoint["id"],
    limit?: number,
  ): Promise<ChargingSession[]> {
    return withErrorLogging(() => {
      const query = limit === undefined ? "" : `?limit=${limit}`;
      return httpClient.get<ChargingSession[]>(
        `/api/charge-points/${chargePointId}/charging-sessions${query}`,
      );
    }, "ChargePoint.listChargingSessions");
  },
  /**
   * One session's estimated cost: always an envelope for an existing session;
   * a 404 (unknown session or out of scope) throws `HttpError`.
   */
  getChargingSessionCost: async function (
    chargePointId: ChargePoint["id"],
    sessionId: ChargingSession["id"],
  ): Promise<ChargingSessionCost> {
    return withErrorLogging(
      () =>
        httpClient.get<ChargingSessionCost>(
          `/api/charge-points/${chargePointId}/charging-sessions/${sessionId}/cost`,
        ),
      "ChargePoint.getChargingSessionCost",
    );
  },
};

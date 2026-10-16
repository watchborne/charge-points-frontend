import type { ChargePoint, ChargingSession } from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

/**
 * An *estimated* cost for one charging session (charge-points-server issue
 * #580) — not part of @watchborne/charge-points-types, like `SiteTariff`,
 * since it's a computation rather than a domain entity. `amountCents` is
 * null exactly when `reason` is set: the session is still `ACTIVE`, no
 * energy figure could be recovered, or its site has no tariff configured —
 * all valid answers, not errors.
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
   * The charge point's charging-session history, newest start first, across
   * every connector — including any session still `ACTIVE`. Unlike
   * `LogUploadView`, `ChargingSession` is a shared-package type
   * (`@watchborne/charge-points-types`), not a locally-declared response
   * surface: `charge-points-server`'s ADR 0012 §8 added it there once this
   * route existed for the frontend to consume.
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
   * One session's estimated cost — always resolves to an envelope for a
   * session that exists (`amountCents`/`reason` explain unavailability); the
   * backend answers 404 only for an unknown session or an out-of-scope
   * charge point, which surfaces as a thrown `HttpError`.
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

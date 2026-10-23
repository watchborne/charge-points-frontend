import type { Alert, ChargePoint } from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

export const chargePointAlertApis = {
  /**
   * The alert history, newest opened first, with who was notified and when.
   * Out of scope answers 200 with an empty list.
   */
  getAlerts: async function (chargePointId: ChargePoint["id"], limit?: number): Promise<Alert[]> {
    return withErrorLogging(() => {
      const query = limit === undefined ? "" : `?limit=${limit}`;
      return httpClient.get<Alert[]>(`/api/charge-points/${chargePointId}/alerts${query}`);
    }, "ChargePoint.getAlerts");
  },
  /**
   * Records that someone has taken an alert on. It stays `OPEN` (resolution
   * follows the condition), now with `acknowledgedAt`/`acknowledgedBy`;
   * idempotent while open. The acknowledger comes from the session server-side.
   *
   * Sends `{}`: the proxy forwards the body as JSON, and an empty JSON body is
   * a 400. Throws on non-2xx: a plain write, no station round trip.
   */
  acknowledgeAlert: async function (
    chargePointId: ChargePoint["id"],
    alertId: Alert["id"],
  ): Promise<Alert> {
    return withErrorLogging(
      () =>
        httpClient.post<Alert>(
          `/api/charge-points/${chargePointId}/alerts/${alertId}/acknowledge`,
          {},
        ),
      "ChargePoint.acknowledgeAlert",
    );
  },
};

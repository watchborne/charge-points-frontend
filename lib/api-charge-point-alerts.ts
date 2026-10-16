import type { Alert, ChargePoint } from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

export const chargePointAlertApis = {
  /**
   * The charge point's alert history, newest opened first — every OPEN and
   * RESOLVED alert, including any still open. The "sent ✔️, to whom, when"
   * read: each entry carries notifiedRecipients/lastNotifiedAt/notificationCount.
   * The backend answers 200 with an empty list for a charge point outside the
   * caller's scope, so there is no 404 to handle.
   */
  getAlerts: async function (chargePointId: ChargePoint["id"], limit?: number): Promise<Alert[]> {
    return withErrorLogging(() => {
      const query = limit === undefined ? "" : `?limit=${limit}`;
      return httpClient.get<Alert[]>(`/api/charge-points/${chargePointId}/alerts${query}`);
    }, "ChargePoint.getAlerts");
  },
  /**
   * Records that a human has taken an alert on (charge-points-server issue
   * #530). Acknowledging never resolves the alert — resolution stays tied to
   * the triggering condition clearing, so the returned alert is still `OPEN`,
   * now with `acknowledgedAt`/`acknowledgedBy` set. Idempotent on an
   * already-acknowledged, still-open alert.
   *
   * No request body: the acknowledger comes from the caller's own session
   * server-side, never from the client. `{}` rather than nothing is sent
   * because the proxy hop forwards `request.text()` verbatim under
   * `Content-Type: application/json`, and an empty body under that header is
   * a 400 at the backend — the same reason `DisplayMessages.requestAll`
   * posts `{}`.
   *
   * Goes through `httpClient` (throws on non-2xx) rather than returning a
   * discriminated outcome like the OCPP commands: this is a plain resource
   * write with no station round trip, so "it failed" is all the caller needs.
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

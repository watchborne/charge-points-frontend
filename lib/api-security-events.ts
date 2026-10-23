import type {
  ChargePoint,
  SecurityEvent as SharedSecurityEvent,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";
import type { Wire } from "./wire";

/** One SecurityEventNotification report, as `GET /api/charge-points/:id/security-events` returns it. */
export type SecurityEvent = Wire<SharedSecurityEvent>;

export const securityEventApis = {
  list: async function (
    chargePointId: ChargePoint["id"],
    limit?: number,
  ): Promise<SecurityEvent[]> {
    return withErrorLogging(() => {
      const query = limit === undefined ? "" : `?limit=${limit}`;
      return httpClient.get<SecurityEvent[]>(
        `/api/charge-points/${chargePointId}/security-events${query}`,
      );
    }, `SecurityEvent.list(${chargePointId})`);
  },
};

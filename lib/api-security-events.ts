import type { ChargePoint } from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// The security-event history's response shape. Not part of
// @watchborne/charge-points-types on purpose, like ConnectionStateEvent/
// ConnectorStatusEvent in api-status-history.ts: the backend keeps
// `SecurityEvent` server-local (charge-points-server ADR 0009) since no
// client consumes it as a domain entity — the dashboard codes against this
// response contract. Timestamps arrive as ISO strings and are parsed where
// rendered, never widened to `Date` here.

/** One SecurityEventNotification report, as `GET /api/charge-points/:id/security-events` returns it. */
export type SecurityEvent = {
  id: string;
  chargePointId: string;
  /** The station's own event-type string (OCPP Security Whitepaper / 2.0.1 §3.4) — open vocabulary, not enum-typed. */
  type: string;
  techInfo?: string;
  /** ISO string: the station's own reported instant, or the server's receipt time on a malformed clock. */
  occurredAt: string;
  createdAt: string;
};

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

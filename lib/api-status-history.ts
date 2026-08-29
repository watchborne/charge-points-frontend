import type { ChargePoint } from "@watchborne/charge-points-types";

import type { ChargePointConnectionStatus, ConnectorStatus } from "@/types/charge-point";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// The status-history reads' response shapes. Not part of
// @watchborne/charge-points-types on purpose, like `MeterSample` in
// api-metering.ts: the backend keeps `ConnectionStateEvent`/`ConnectorStatusEvent`
// server-local (ADR 0008) since no client consumes them as domain entities —
// the dashboard codes against these response contracts. Timestamps arrive as
// ISO strings and are parsed where rendered, never widened to `Date` here.

/** One connection-status transition, as `GET /api/charge-points/:id/connection-events` returns it. */
export type ConnectionStateEvent = {
  id: string;
  chargePointId: string;
  status: ChargePointConnectionStatus;
  /** `null` for a charge point's first-ever recorded connection status. */
  previousStatus: ChargePointConnectionStatus | null;
  statusMessage?: string;
  /** ISO string: when the transition happened — always the server's clock (no device timestamp for this stream). */
  occurredAt: string;
  createdAt: string;
};

/** One connector-status transition, as `GET /api/charge-points/:id/connector-status-events` returns it. */
export type ConnectorStatusEvent = {
  id: string;
  chargePointId: string;
  /** The OCPP connector ordinal, as on `Connector.connectorId` — not a UUID. `0` is the whole-charge-point entry. */
  connectorId: number;
  status: ConnectorStatus;
  /** `null` for a connector's first-ever recorded status. */
  previousStatus: ConnectorStatus | null;
  errorCode?: string;
  /** ISO string: the station's own reported instant when it carried one, the server's receipt time otherwise. */
  occurredAt: string;
  createdAt: string;
};

export type StatusHistoryQuery = {
  since?: Date;
  until?: Date;
  limit?: number;
};

export type ConnectorStatusHistoryQuery = StatusHistoryQuery & {
  connectorId?: number;
};

const buildQuery = ({
  connectorId,
  since,
  until,
  limit,
}: ConnectorStatusHistoryQuery = {}): string => {
  const params = new URLSearchParams();

  if (connectorId !== undefined) params.set("connectorId", String(connectorId));
  if (since) params.set("since", since.toISOString());
  if (until) params.set("until", until.toISOString());
  if (limit !== undefined) params.set("limit", String(limit));

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const statusHistoryApis = {
  getConnectionEvents: async function (
    chargePointId: ChargePoint["id"],
    query: StatusHistoryQuery = {},
  ): Promise<ConnectionStateEvent[]> {
    return withErrorLogging(
      () =>
        httpClient.get<ConnectionStateEvent[]>(
          `/api/charge-points/${chargePointId}/connection-events${buildQuery(query)}`,
        ),
      `StatusHistory.getConnectionEvents(${chargePointId})`,
    );
  },
  getConnectorStatusEvents: async function (
    chargePointId: ChargePoint["id"],
    query: ConnectorStatusHistoryQuery = {},
  ): Promise<ConnectorStatusEvent[]> {
    return withErrorLogging(
      () =>
        httpClient.get<ConnectorStatusEvent[]>(
          `/api/charge-points/${chargePointId}/connector-status-events${buildQuery(query)}`,
        ),
      `StatusHistory.getConnectorStatusEvents(${chargePointId})`,
    );
  },
};

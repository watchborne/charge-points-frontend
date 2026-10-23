import type {
  ChargePoint,
  ConnectionStateEvent as SharedConnectionStateEvent,
  ConnectorStatusEvent as SharedConnectorStatusEvent,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";
import type { Wire } from "./wire";

/** One connection-status transition, as `GET /api/charge-points/:id/connection-events` returns it. */
export type ConnectionStateEvent = Wire<SharedConnectionStateEvent>;

/** One connector-status transition, as `GET /api/charge-points/:id/connector-status-events` returns it. */
export type ConnectorStatusEvent = Wire<SharedConnectorStatusEvent>;

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

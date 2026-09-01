import type { ChargePoint } from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// The NotifyEvent history's response shape. Not part of
// @watchborne/charge-points-types on purpose, like SecurityEvent/
// ConnectionStateEvent: the backend keeps `DeviceEventReport` server-local
// (charge-points-server ADR 0011) since no client consumes it as a domain
// entity — the dashboard codes against this response contract. Timestamps
// arrive as ISO strings and are parsed where rendered, never widened to
// `Date` here.

/** OCPP 2.0.1's generic device-model identifiers — vendor-defined, open vocabulary. */
export type DeviceEventComponent = {
  name: string;
  instance?: string;
  evseId?: number;
  connectorId?: number;
};

export type DeviceEventVariable = {
  name: string;
  instance?: string;
};

export type DeviceEventEntry = {
  eventId: number;
  /** ISO string — the station's own reported instant. */
  timestamp: string;
  trigger: "Alerting" | "Delta" | "Periodic";
  cause?: number;
  actualValue: string;
  techCode?: string;
  techInfo?: string;
  /** True when this entry reports a previously alerted condition clearing. */
  cleared?: boolean;
  transactionId?: string;
  variableMonitoringId?: number;
  eventNotificationType:
    | "HardWiredNotification"
    | "HardWiredMonitor"
    | "PreconfiguredMonitor"
    | "CustomMonitor";
  component: DeviceEventComponent;
  variable: DeviceEventVariable;
};

/** One NotifyEvent frame, as `GET /api/charge-points/:id/device-events` returns it. */
export type DeviceEventReport = {
  id: string;
  chargePointId: string;
  requestId: number;
  /** ISO string. */
  generatedAt: string;
  seqNo: number;
  tbc: boolean;
  events: DeviceEventEntry[];
  createdAt: string;
};

export const deviceEventApis = {
  list: async function (
    chargePointId: ChargePoint["id"],
    limit?: number,
  ): Promise<DeviceEventReport[]> {
    return withErrorLogging(() => {
      const query = limit === undefined ? "" : `?limit=${limit}`;
      return httpClient.get<DeviceEventReport[]>(
        `/api/charge-points/${chargePointId}/device-events${query}`,
      );
    }, `DeviceEvent.list(${chargePointId})`);
  },
};

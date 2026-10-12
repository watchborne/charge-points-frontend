import type { ChargePoint, VariableV201 } from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// The NotifyEvent history's response shape. The backend keeps the
// `DeviceEventReport` row server-local (charge-points-server ADR 0011), so the
// frame itself is declared here; timestamps arrive as ISO strings and are parsed
// where rendered, never widened to `Date` here.
//
// What *is* shared is the variable identifier (`VariableV201`). The component is
// not: the API flattens OCPP's nested `evse: { id, connectorId }` into
// `evseId` / `connectorId`, so it deliberately differs from the package's
// `ComponentV201` and stays declared locally.

/** OCPP 2.0.1's generic device-model identifiers — vendor-defined, open vocabulary. */
export type DeviceEventComponent = {
  name: string;
  instance?: string;
  evseId?: number;
  connectorId?: number;
};

export type DeviceEventVariable = VariableV201;

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
    "HardWiredNotification" | "HardWiredMonitor" | "PreconfiguredMonitor" | "CustomMonitor";
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

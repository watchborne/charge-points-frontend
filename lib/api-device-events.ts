import type { ChargePoint, VariableV201 } from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// The NotifyEvent history, declared locally (server-local entity);
// timestamps are ISO strings. `VariableV201` is shared, but the component
// flattens `evse` into `evseId`/`connectorId`, so it isn't `ComponentV201`.

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

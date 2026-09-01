import type { ChargePoint } from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// The NotifyReport history's response shape. Not part of
// @watchborne/charge-points-types on purpose, like DeviceEventReport/
// SecurityEvent: the backend keeps `DeviceVariableReport` server-local
// (charge-points-server ADR 0011) since no client consumes it as a domain
// entity — the dashboard codes against this response contract. Timestamps
// arrive as ISO strings and are parsed where rendered, never widened to
// `Date` here.

/** OCPP 2.0.1's generic device-model identifiers — vendor-defined, open vocabulary. */
export type DeviceVariableComponent = {
  name: string;
  instance?: string;
  evseId?: number;
  connectorId?: number;
};

export type DeviceVariableName = {
  name: string;
  instance?: string;
};

export type DeviceVariableAttribute = {
  /** Defaults to "Actual" per spec when the station omits it. */
  type?: "Actual" | "Target" | "MinSet" | "MaxSet";
  value?: string;
  mutability?: "ReadOnly" | "WriteOnly" | "ReadWrite";
  persistent?: boolean;
  constant?: boolean;
};

export type DeviceVariableReportEntry = {
  component: DeviceVariableComponent;
  variable: DeviceVariableName;
  attributes: DeviceVariableAttribute[];
};

/** One NotifyReport frame, as `GET /api/charge-points/:id/device-variable-reports` returns it. */
export type DeviceVariableReport = {
  id: string;
  chargePointId: string;
  requestId: number;
  /** ISO string. */
  generatedAt: string;
  seqNo: number;
  tbc: boolean;
  entries: DeviceVariableReportEntry[];
  createdAt: string;
};

export const deviceVariableReportApis = {
  list: async function (
    chargePointId: ChargePoint["id"],
    limit?: number,
  ): Promise<DeviceVariableReport[]> {
    return withErrorLogging(() => {
      const query = limit === undefined ? "" : `?limit=${limit}`;
      return httpClient.get<DeviceVariableReport[]>(
        `/api/charge-points/${chargePointId}/device-variable-reports${query}`,
      );
    }, `DeviceVariableReport.list(${chargePointId})`);
  },
};

import {
  GET_BASE_REPORT_TYPES_V201,
  type AttributeTypeV201,
  type ChargePoint,
  type GenericDeviceModelStatusV201,
  type GetBaseReportBaseV201,
  type VariableV201,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import type { CommandOutcome } from "./command-outcome";
import { fetchWithFreshSession, httpClient } from "./http-client";

export { GET_BASE_REPORT_TYPES_V201 };
export type { GetBaseReportBaseV201 };

// The NotifyReport history's response shape. The backend keeps the
// `DeviceVariableReport` row server-local (charge-points-server ADR 0011), so the
// frame itself is declared here; timestamps arrive as ISO strings and are parsed
// where rendered, never widened to `Date` here.
//
// The variable identifier (`VariableV201`) and the attribute type
// (`AttributeTypeV201`) are the shared package's. The component is not: the API
// flattens OCPP's nested `evse: { id, connectorId }` into `evseId` /
// `connectorId`, so it deliberately differs from `ComponentV201` and stays local.

/** OCPP 2.0.1's generic device-model identifiers — vendor-defined, open vocabulary. */
export type DeviceVariableComponent = {
  name: string;
  instance?: string;
  evseId?: number;
  connectorId?: number;
};

export type DeviceVariableName = VariableV201;

export type DeviceVariableAttribute = {
  /** Defaults to "Actual" per spec when the station omits it. */
  type?: AttributeTypeV201;
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

/**
 * One outstanding GetBaseReport/GetReport request (charge-points-server ADR
 * 0014). Not part of @watchborne/charge-points-types either, same reasoning
 * as `DeviceVariableReport` above — the two POST endpoints below return it
 * inline; there is no GET route for it, so it's never read back on its own.
 */
export type ReportRequest = {
  id: string;
  chargePointId: string;
  requestId: number;
  kind: "BASE_REPORT" | "REPORT";
  reportBase: GetBaseReportBaseV201 | null;
  /** ISO string. */
  startedAt: string;
  /** ISO string, or `null` while the request is still awaiting NotifyReport frame(s). */
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Same discriminated-result shape as `StartLogUploadOutcome`
 * (`api-charge-points.ts`): the caller needs the specific HTTP outcome, not
 * just success/failure, so this reads the raw response rather than going
 * through `httpClient`.
 */
export type RequestDeviceReportOutcome = CommandOutcome<{
  status: GenericDeviceModelStatusV201;
  reportRequest: ReportRequest | null;
}>;

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
  /**
   * Requests a station-defined flavor of its device-model inventory (OCPP
   * `GetBaseReport`, 2.0.1 only). Acknowledgment-only: the actual inventory
   * arrives later as one or more `NotifyReport` frames, which
   * `DeviceVariableReportsPanel`'s history picks up on its next fetch.
   */
  requestBaseReport: async function (
    chargePointId: ChargePoint["id"],
    reportBase: GetBaseReportBaseV201,
  ): Promise<RequestDeviceReportOutcome> {
    try {
      const response = await fetchWithFreshSession(
        `/api/charge-points/${chargePointId}/base-report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportBase }),
        },
      );

      if (response.ok) {
        const { status, reportRequest } = (await response.json()) as {
          status: GenericDeviceModelStatusV201;
          reportRequest: ReportRequest | null;
        };
        return { ok: true, status, reportRequest };
      }

      return { ok: false, httpStatus: response.status };
    } catch (error) {
      console.error(`Failed to request a base report on charge point ${chargePointId}`, error);
      return { ok: false, httpStatus: 0 };
    }
  },
  /**
   * Requests a station's full device-model inventory (OCPP `GetReport`,
   * 2.0.1 only), unfiltered — component/variable filtering isn't exposed yet
   * (charge-points-server ADR 0014 decision 6). Same acknowledgment-only
   * shape as `requestBaseReport` above.
   */
  requestReport: async function (
    chargePointId: ChargePoint["id"],
  ): Promise<RequestDeviceReportOutcome> {
    try {
      const response = await fetchWithFreshSession(`/api/charge-points/${chargePointId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const { status, reportRequest } = (await response.json()) as {
          status: GenericDeviceModelStatusV201;
          reportRequest: ReportRequest | null;
        };
        return { ok: true, status, reportRequest };
      }

      return { ok: false, httpStatus: response.status };
    } catch (error) {
      console.error(`Failed to request a report on charge point ${chargePointId}`, error);
      return { ok: false, httpStatus: 0 };
    }
  },
};

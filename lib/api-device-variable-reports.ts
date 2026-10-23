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

// The NotifyReport history, declared locally (server-local entity);
// timestamps are ISO strings. `VariableV201` and `AttributeTypeV201` are
// shared; the component flattens `evse`, so it isn't `ComponentV201`.

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
 * One outstanding GetBaseReport/GetReport request, returned inline by the two
 * POSTs below; there is no GET for it.
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

/** The specific HTTP outcome, read from the raw response. */
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
   * Requests a station-defined inventory flavor (`GetBaseReport`, 2.0.1).
   * The station only acknowledges; the inventory arrives as `NotifyReport`
   * frames picked up on the panel's next fetch.
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
   * Requests the full, unfiltered inventory (`GetReport`, 2.0.1); same
   * acknowledgment-only shape.
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

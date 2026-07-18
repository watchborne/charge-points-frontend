import type {
  AvailabilityType,
  ChangeAvailabilityStatus,
  ChargePoint,
  ChargePointWithConnectors,
  ChargePointWithSite,
  ConfigurationKey,
  ResetStatus,
  ResetType,
  UnlockConnectorStatus,
} from "@watchborne/charge-points-types";

import { httpClient } from "./http-client";

type CreateChargePointBody = Pick<ChargePoint, "name" | "siteId" | "meta" | "isActive">;

type PatchChargePointBody = Partial<CreateChargePointBody>;

/**
 * Reset is a request/response OCPP command, not a plain resource write: the
 * caller needs the specific outcome (accepted vs. offline/rejected/timeout) to
 * give precise feedback. `httpClient` collapses every non-2xx into one generic
 * error, so this method reads the raw HTTP status itself and returns a
 * discriminated result rather than throwing. `httpStatus` is 0 for a network
 * failure that never reached the proxy.
 */
export type ResetChargePointOutcome =
  { ok: true; status: ResetStatus } | { ok: false; httpStatus: number };

/**
 * Same discriminated-result shape as `ResetChargePointOutcome`, for the same
 * reason: ChangeAvailability is a request/response OCPP command whose caller
 * needs the specific outcome (accepted/scheduled vs. offline/rejected/timeout).
 */
export type ChangeAvailabilityOutcome =
  { ok: true; status: ChangeAvailabilityStatus } | { ok: false; httpStatus: number };

/**
 * Same discriminated-result shape as `ResetChargePointOutcome`, for the same
 * reason: UnlockConnector is a request/response OCPP command whose caller
 * needs the specific outcome (unlocked vs. offline/unlock-failed/not-supported/timeout).
 */
export type UnlockConnectorOutcome =
  { ok: true; status: UnlockConnectorStatus } | { ok: false; httpStatus: number };

/**
 * GetConfiguration is a request/response OCPP read: on success it returns the
 * station's reported configuration rather than a status. Same raw-status
 * discriminated shape as the other commands for precise offline/timeout feedback.
 */
export type GetConfigurationOutcome =
  | { ok: true; configurationKey?: ConfigurationKey[]; unknownKey?: string[] }
  | { ok: false; httpStatus: number };

export const chargePointApis = {
  getChargePoints: async function (): Promise<ChargePointWithConnectors[]> {
    try {
      return await httpClient.get<ChargePointWithConnectors[]>("/api/charge-points");
    } catch (error) {
      console.error("Failed to fetch charge points", error);
      throw error;
    }
  },
  getChargePoint: async function (
    ChargePointId: ChargePoint["id"],
  ): Promise<ChargePointWithSite | undefined> {
    try {
      return await httpClient.get<ChargePointWithSite | undefined>(
        `/api/charge-points/${ChargePointId}`,
      );
    } catch (error) {
      console.error(`Failed to fetch charge point ${ChargePointId}`, error);
      throw error;
    }
  },
  createChargePoint: async function (
    body: CreateChargePointBody,
  ): Promise<ChargePointWithConnectors> {
    try {
      return await httpClient.post<ChargePointWithConnectors>("/api/charge-points", body);
    } catch (error) {
      console.error("Failed to create charge point", error, body);
      throw error;
    }
  },
  updateChargePoint: async function (
    chargePointId: ChargePoint["id"],
    patchBody: PatchChargePointBody,
  ): Promise<ChargePointWithConnectors> {
    try {
      return await httpClient.patch<ChargePointWithConnectors>(
        `/api/charge-points/${chargePointId}`,
        patchBody,
      );
    } catch (error) {
      console.error(`Failed to update charge point ${chargePointId}`, error, patchBody);
      throw error;
    }
  },
  deleteChargePoint: async function (chargePointId: ChargePoint["id"]): Promise<void> {
    try {
      await httpClient.delete(`/api/charge-points/${chargePointId}`);
    } catch (error) {
      console.error(`Failed to delete charge point ${chargePointId}`, error);
      throw error;
    }
  },
  resetChargePoint: async function (
    chargePointId: ChargePoint["id"],
    type: ResetType,
  ): Promise<ResetChargePointOutcome> {
    try {
      const response = await fetch(`/api/charge-points/${chargePointId}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const { status } = (await response.json()) as { status: ResetStatus };
        return { ok: true, status };
      }

      return { ok: false, httpStatus: response.status };
    } catch (error) {
      console.error(`Failed to reset charge point ${chargePointId}`, error);
      return { ok: false, httpStatus: 0 };
    }
  },
  changeAvailability: async function (
    chargePointId: ChargePoint["id"],
    connectorId: number,
    type: AvailabilityType,
  ): Promise<ChangeAvailabilityOutcome> {
    try {
      const response = await fetch(`/api/charge-points/${chargePointId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorId, type }),
      });

      if (response.ok) {
        const { status } = (await response.json()) as { status: ChangeAvailabilityStatus };
        return { ok: true, status };
      }

      return { ok: false, httpStatus: response.status };
    } catch (error) {
      console.error(`Failed to change availability of charge point ${chargePointId}`, error);
      return { ok: false, httpStatus: 0 };
    }
  },
  unlockConnector: async function (
    chargePointId: ChargePoint["id"],
    connectorId: number,
  ): Promise<UnlockConnectorOutcome> {
    try {
      const response = await fetch(`/api/charge-points/${chargePointId}/unlock-connector`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorId }),
      });

      if (response.ok) {
        const { status } = (await response.json()) as { status: UnlockConnectorStatus };
        return { ok: true, status };
      }

      return { ok: false, httpStatus: response.status };
    } catch (error) {
      console.error(`Failed to unlock connector of charge point ${chargePointId}`, error);
      return { ok: false, httpStatus: 0 };
    }
  },
  getConfiguration: async function (
    chargePointId: ChargePoint["id"],
    key?: string[],
  ): Promise<GetConfigurationOutcome> {
    try {
      const response = await fetch(`/api/charge-points/${chargePointId}/configuration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(key ? { key } : {}),
      });

      if (response.ok) {
        const { configurationKey, unknownKey } = (await response.json()) as {
          configurationKey?: ConfigurationKey[];
          unknownKey?: string[];
        };
        return { ok: true, configurationKey, unknownKey };
      }

      return { ok: false, httpStatus: response.status };
    } catch (error) {
      console.error(`Failed to read configuration of charge point ${chargePointId}`, error);
      return { ok: false, httpStatus: 0 };
    }
  },
};

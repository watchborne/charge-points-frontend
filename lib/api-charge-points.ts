import type {
  AvailabilityType,
  ChangeAvailabilityStatus,
  ChangeConfigurationStatus,
  ChargePoint,
  ConfigurationKey,
  ResetStatus,
  ResetType,
  TriggerMessageStatus,
  TriggerMessageType,
  UnlockConnectorStatus,
} from "@watchborne/charge-points-types";

import type {
  ChargePointWithConnectors,
  ChargePointWithSite,
  CreatedChargePoint,
} from "@/types/charge-point";

import { withErrorLogging, withErrorLoggingAsync } from "./api-error-wrapper";
import type { CommandOutcome } from "./command-outcome";
import { fetchWithFreshSession, httpClient } from "./http-client";

type CreateChargePointBody = Pick<ChargePoint, "siteId" | "meta" | "isActive"> & {
  /** Optional: left out, the backend generates a readable name. */
  name?: ChargePoint["name"];
  /** Defaults to false server-side; set later from the detail panel. */
  realtimeAlertsEnabled?: ChargePoint["realtimeAlertsEnabled"];
};

type PatchChargePointBody = Partial<CreateChargePointBody>;

/**
 * An OCPP command's outcome: the caller needs the specific result (accepted
 * vs. offline/rejected/timeout), so the raw HTTP status is read instead of
 * throwing. `httpStatus` is 0 for a network failure.
 */
export type ResetChargePointOutcome = CommandOutcome<{ status: ResetStatus }>;

export type ChangeAvailabilityOutcome = CommandOutcome<{ status: ChangeAvailabilityStatus }>;

export type UnlockConnectorOutcome = CommandOutcome<{ status: UnlockConnectorStatus }>;

/** A station settings read: the reported configuration on success. */
export type GetSettingsOutcome = CommandOutcome<{
  configurationKey?: ConfigurationKey[];
  unknownKey?: string[];
}>;

/**
 * `status` uses OCPP 1.6's vocabulary whatever the dialect: the backend maps
 * 2.0.1's statuses onto it.
 */
export type SetSettingOutcome = CommandOutcome<{ status: ChangeConfigurationStatus }>;

export type TriggerMessageOutcome = CommandOutcome<{ status: TriggerMessageStatus }>;

/**
 * Fails with a specific outcome when the charge point is out of scope or
 * already released. Success (204) has no payload.
 */
export type ReleaseChargePointOutcome = CommandOutcome;

export const chargePointApis = {
  getChargePoints: async function (): Promise<ChargePointWithConnectors[]> {
    return withErrorLogging(
      () => httpClient.get<ChargePointWithConnectors[]>("/api/charge-points"),
      "ChargePoint.getChargePoints",
    );
  },
  getChargePoint: async function (
    ChargePointId: ChargePoint["id"],
  ): Promise<ChargePointWithSite | undefined> {
    return withErrorLogging(
      () => httpClient.get<ChargePointWithSite | undefined>(`/api/charge-points/${ChargePointId}`),
      "ChargePoint.getChargePoint",
    );
  },
  createChargePoint: async function (body: CreateChargePointBody): Promise<CreatedChargePoint> {
    return withErrorLogging(
      () => httpClient.post<CreatedChargePoint>("/api/charge-points", body),
      "ChargePoint.createChargePoint",
    );
  },
  updateChargePoint: async function (
    chargePointId: ChargePoint["id"],
    patchBody: PatchChargePointBody,
  ): Promise<ChargePointWithConnectors> {
    return withErrorLogging(
      () =>
        httpClient.patch<ChargePointWithConnectors>(
          `/api/charge-points/${chargePointId}`,
          patchBody,
        ),
      "ChargePoint.updateChargePoint",
    );
  },
  deleteChargePoint: async function (chargePointId: ChargePoint["id"]): Promise<void> {
    return withErrorLogging(
      () => httpClient.delete(`/api/charge-points/${chargePointId}`),
      "ChargePoint.deleteChargePoint",
    );
  },
  /**
   * Drops the caller's own membership, e.g. on a station claimed by the
   * wrong installer. Other members keep theirs; the last one leaving returns
   * the station to unclaimed and detaches it from its site. Out of scope or
   * already released is a 404.
   */
  releaseChargePoint: async function (
    chargePointId: ChargePoint["id"],
  ): Promise<ReleaseChargePointOutcome> {
    return withErrorLoggingAsync(async () => {
      const response = await fetchWithFreshSession(`/api/charge-points/${chargePointId}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        return { ok: true };
      }

      return { ok: false, httpStatus: response.status };
    }, "ChargePoint.releaseChargePoint");
  },
  resetChargePoint: async function (
    chargePointId: ChargePoint["id"],
    type: ResetType,
  ): Promise<ResetChargePointOutcome> {
    return withErrorLoggingAsync(async () => {
      const response = await fetchWithFreshSession(`/api/charge-points/${chargePointId}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const { status } = (await response.json()) as { status: ResetStatus };
        return { ok: true, status };
      }

      return { ok: false, httpStatus: response.status };
    }, "ChargePoint.resetChargePoint");
  },
  changeAvailability: async function (
    chargePointId: ChargePoint["id"],
    connectorId: number,
    type: AvailabilityType,
  ): Promise<ChangeAvailabilityOutcome> {
    return withErrorLoggingAsync(async () => {
      const response = await fetchWithFreshSession(
        `/api/charge-points/${chargePointId}/availability`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectorId, type }),
        },
      );

      if (response.ok) {
        const { status } = (await response.json()) as { status: ChangeAvailabilityStatus };
        return { ok: true, status };
      }

      return { ok: false, httpStatus: response.status };
    }, "ChargePoint.changeAvailability");
  },
  unlockConnector: async function (
    chargePointId: ChargePoint["id"],
    connectorId: number,
  ): Promise<UnlockConnectorOutcome> {
    return withErrorLoggingAsync(async () => {
      const response = await fetchWithFreshSession(
        `/api/charge-points/${chargePointId}/unlock-connector`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectorId }),
        },
      );

      if (response.ok) {
        const { status } = (await response.json()) as { status: UnlockConnectorStatus };
        return { ok: true, status };
      }

      return { ok: false, httpStatus: response.status };
    }, "ChargePoint.unlockConnector");
  },
  /**
   * Reads the station's settings as flat keys, through the dialect-neutral
   * `/settings` endpoint: the backend picks GetConfiguration or GetVariables.
   */
  getSettings: async function (
    chargePointId: ChargePoint["id"],
    key?: string[],
  ): Promise<GetSettingsOutcome> {
    return withErrorLoggingAsync(async () => {
      const response = await fetchWithFreshSession(`/api/charge-points/${chargePointId}/settings`, {
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
    }, "ChargePoint.getSettings");
  },
  /** Writes one setting by flat key. */
  setSetting: async function (
    chargePointId: ChargePoint["id"],
    key: string,
    value: string,
  ): Promise<SetSettingOutcome> {
    return withErrorLoggingAsync(async () => {
      const response = await fetchWithFreshSession(`/api/charge-points/${chargePointId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      if (response.ok) {
        const { status } = (await response.json()) as { status: ChangeConfigurationStatus };
        return { ok: true, status };
      }

      return { ok: false, httpStatus: response.status };
    }, "ChargePoint.setSetting");
  },
  triggerMessage: async function (
    chargePointId: ChargePoint["id"],
    requestedMessage: TriggerMessageType,
    connectorId?: number,
  ): Promise<TriggerMessageOutcome> {
    return withErrorLoggingAsync(async () => {
      const response = await fetchWithFreshSession(`/api/charge-points/${chargePointId}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          connectorId != null ? { requestedMessage, connectorId } : { requestedMessage },
        ),
      });

      if (response.ok) {
        const { status } = (await response.json()) as { status: TriggerMessageStatus };
        return { ok: true, status };
      }

      return { ok: false, httpStatus: response.status };
    }, "ChargePoint.triggerMessage");
  },
};

import type {
  Alert,
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
  UpdateFirmwareStatusV201,
} from "@watchborne/charge-points-types";

import type { ChargePointWithConnectors, ChargePointWithSite } from "@/types/charge-point";
import type { ChargePointFirmware, FirmwareUpdateView } from "@/types/firmware";

import { httpClient } from "./http-client";

type CreateChargePointBody = Pick<ChargePoint, "name" | "siteId" | "meta" | "isActive"> & {
  /** Optional here unlike isActive: defaults to false server-side (opt-in),
   * and there is no creation-time UI for it — an installer sets it later via
   * the detail panel's toggle (a PATCH). */
  realtimeAlertsEnabled?: ChargePoint["realtimeAlertsEnabled"];
};

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
 * Reading a station's settings is a request/response OCPP read: on success it
 * returns the station's reported configuration rather than a status. Same
 * raw-status discriminated shape as the other commands for precise
 * offline/timeout feedback.
 */
export type GetSettingsOutcome =
  | { ok: true; configurationKey?: ConfigurationKey[]; unknownKey?: string[] }
  | { ok: false; httpStatus: number };

/**
 * Same discriminated-result shape as `ResetChargePointOutcome`, for the same
 * reason: writing a setting is a request/response OCPP command whose caller
 * needs the specific outcome (accepted/reboot-required vs. offline/rejected/
 * not-supported/timeout). `status` keeps OCPP 1.6's vocabulary whatever dialect
 * the station speaks — the backend normalizes 2.0.1's per-target statuses onto
 * it (see its `ocpp-supported-actions.md` §15).
 */
export type SetSettingOutcome =
  { ok: true; status: ChangeConfigurationStatus } | { ok: false; httpStatus: number };

/**
 * Same discriminated-result shape as `ResetChargePointOutcome`, for the same
 * reason: TriggerMessage is a request/response OCPP command whose caller needs
 * the specific outcome (accepted vs. offline/rejected/not-implemented/timeout).
 */
export type TriggerMessageOutcome =
  { ok: true; status: TriggerMessageStatus } | { ok: false; httpStatus: number };

/**
 * Same discriminated-result shape as `ResetChargePointOutcome`, plus one wrinkle
 * the other commands don't have: **`status` is `null` for an OCPP 1.6 station**.
 *
 * 1.6's `UpdateFirmware.conf` is an empty payload, so the station acknowledges
 * the frame without saying whether it will comply — the backend answers `202`
 * rather than `200` for exactly that reason. A `null` status therefore means
 * "requested, outcome unknown until the station reports", not "failed".
 */
export type StartFirmwareUpdateOutcome =
  | { ok: true; status: UpdateFirmwareStatusV201 | null; update: FirmwareUpdateView }
  | { ok: false; httpStatus: number };

/** What an installer fills in to start an update, before dialect translation. */
export type StartFirmwareUpdateBody = {
  location: string;
  retrieveDateTime: string;
  retries?: number;
  retryInterval?: number;
  /** OCPP 2.0.1 only — dropped for a 1.6 station, which has nowhere to put it. */
  signingCertificate?: string;
  signature?: string;
};

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
  /**
   * Reads the station's settings as a flat key/value list.
   *
   * Hits the **dialect-neutral** `/settings` endpoint rather than the raw
   * `/configuration` one: `GetConfiguration` (OCPP 1.6) and `GetVariables`
   * (2.0.1) are different actions over incompatible request shapes, and which
   * applies is a property of the station. The backend owns that decision, so a
   * 2.0.1 station is readable here without the client branching on
   * `chargePoint.ocppVersion`.
   */
  getSettings: async function (
    chargePointId: ChargePoint["id"],
    key?: string[],
  ): Promise<GetSettingsOutcome> {
    try {
      const response = await fetch(`/api/charge-points/${chargePointId}/settings`, {
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
      console.error(`Failed to read settings of charge point ${chargePointId}`, error);
      return { ok: false, httpStatus: 0 };
    }
  },
  /** Writes one setting by flat key — the write half of `getSettings` above. */
  setSetting: async function (
    chargePointId: ChargePoint["id"],
    key: string,
    value: string,
  ): Promise<SetSettingOutcome> {
    try {
      const response = await fetch(`/api/charge-points/${chargePointId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      if (response.ok) {
        const { status } = (await response.json()) as { status: ChangeConfigurationStatus };
        return { ok: true, status };
      }

      return { ok: false, httpStatus: response.status };
    } catch (error) {
      console.error(`Failed to change a setting of charge point ${chargePointId}`, error);
      return { ok: false, httpStatus: 0 };
    }
  },
  /**
   * The charge point's firmware picture: the update in flight and the last
   * finished one.
   *
   * A plain read, so it goes through `httpClient` like the other GETs — unlike
   * the OCPP commands above, there is no per-outcome HTTP status to
   * discriminate. The backend answers 200 even for a charge point outside the
   * caller's scope (both fields `null`), so there is no 404 to handle either.
   */
  getFirmware: async function (chargePointId: ChargePoint["id"]): Promise<ChargePointFirmware> {
    try {
      return await httpClient.get<ChargePointFirmware>(
        `/api/charge-points/${chargePointId}/firmware`,
      );
    } catch (error) {
      console.error(`Failed to fetch firmware state of charge point ${chargePointId}`, error);
      throw error;
    }
  },
  /** The charge point's firmware update history, newest start first. */
  listFirmwareUpdates: async function (
    chargePointId: ChargePoint["id"],
    limit?: number,
  ): Promise<FirmwareUpdateView[]> {
    try {
      const query = limit === undefined ? "" : `?limit=${limit}`;
      return await httpClient.get<FirmwareUpdateView[]>(
        `/api/charge-points/${chargePointId}/firmware-updates${query}`,
      );
    } catch (error) {
      console.error(`Failed to fetch firmware history of charge point ${chargePointId}`, error);
      throw error;
    }
  },
  /**
   * The charge point's alert history, newest opened first — every OPEN and
   * RESOLVED alert, including any still open. The "sent ✔️, to whom, when"
   * read: each entry carries notifiedRecipients/lastNotifiedAt/notificationCount.
   * The backend answers 200 with an empty list for a charge point outside the
   * caller's scope, so there is no 404 to handle.
   */
  getAlerts: async function (chargePointId: ChargePoint["id"], limit?: number): Promise<Alert[]> {
    try {
      const query = limit === undefined ? "" : `?limit=${limit}`;
      return await httpClient.get<Alert[]>(`/api/charge-points/${chargePointId}/alerts${query}`);
    } catch (error) {
      console.error(`Failed to fetch alert history of charge point ${chargePointId}`, error);
      throw error;
    }
  },
  /**
   * Starts a firmware update. Like the other OCPP commands this reads the raw HTTP
   * status rather than going through `httpClient`, because the caller needs the
   * specific outcome — and here also needs to tell `200` (station answered) from
   * `202` (1.6 station acknowledged and said nothing).
   */
  startFirmwareUpdate: async function (
    chargePointId: ChargePoint["id"],
    body: StartFirmwareUpdateBody,
  ): Promise<StartFirmwareUpdateOutcome> {
    try {
      const response = await fetch(`/api/charge-points/${chargePointId}/firmware`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const { status, update } = (await response.json()) as {
          status: UpdateFirmwareStatusV201 | null;
          update: FirmwareUpdateView;
        };
        return { ok: true, status, update };
      }

      return { ok: false, httpStatus: response.status };
    } catch (error) {
      console.error(`Failed to start a firmware update on charge point ${chargePointId}`, error);
      return { ok: false, httpStatus: 0 };
    }
  },
  triggerMessage: async function (
    chargePointId: ChargePoint["id"],
    requestedMessage: TriggerMessageType,
    connectorId?: number,
  ): Promise<TriggerMessageOutcome> {
    try {
      const response = await fetch(`/api/charge-points/${chargePointId}/trigger`, {
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
    } catch (error) {
      console.error(`Failed to trigger a message on charge point ${chargePointId}`, error);
      return { ok: false, httpStatus: 0 };
    }
  },
};

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
  /**
   * Optional since ADR 0010 (charge-points-server): a cosmetic label with no
   * uniqueness constraint. Left out, the backend generates a readable one —
   * an installer with no name in mind is never forced to invent one.
   */
  name?: ChargePoint["name"];
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
export type ResetChargePointOutcome = CommandOutcome<{ status: ResetStatus }>;

/**
 * Same discriminated-result shape as `ResetChargePointOutcome`, for the same
 * reason: ChangeAvailability is a request/response OCPP command whose caller
 * needs the specific outcome (accepted/scheduled vs. offline/rejected/timeout).
 */
export type ChangeAvailabilityOutcome = CommandOutcome<{ status: ChangeAvailabilityStatus }>;

/**
 * Same discriminated-result shape as `ResetChargePointOutcome`, for the same
 * reason: UnlockConnector is a request/response OCPP command whose caller
 * needs the specific outcome (unlocked vs. offline/unlock-failed/not-supported/timeout).
 */
export type UnlockConnectorOutcome = CommandOutcome<{ status: UnlockConnectorStatus }>;

/**
 * Reading a station's settings is a request/response OCPP read: on success it
 * returns the station's reported configuration rather than a status. Same
 * raw-status discriminated shape as the other commands for precise
 * offline/timeout feedback.
 */
export type GetSettingsOutcome = CommandOutcome<{
  configurationKey?: ConfigurationKey[];
  unknownKey?: string[];
}>;

/**
 * Same discriminated-result shape as `ResetChargePointOutcome`, for the same
 * reason: writing a setting is a request/response OCPP command whose caller
 * needs the specific outcome (accepted/reboot-required vs. offline/rejected/
 * not-supported/timeout). `status` keeps OCPP 1.6's vocabulary whatever dialect
 * the station speaks — the backend normalizes 2.0.1's per-target statuses onto
 * it (see its `ocpp-supported-actions.md` §15).
 */
export type SetSettingOutcome = CommandOutcome<{ status: ChangeConfigurationStatus }>;

/**
 * Same discriminated-result shape as `ResetChargePointOutcome`, for the same
 * reason: TriggerMessage is a request/response OCPP command whose caller needs
 * the specific outcome (accepted vs. offline/rejected/not-implemented/timeout).
 */
export type TriggerMessageOutcome = CommandOutcome<{ status: TriggerMessageStatus }>;

/**
 * Same discriminated-result shape as `ResetChargePointOutcome`, for the same
 * reason: releasing a charge point (charge-points-server ADR 0028) can fail
 * with a specific, user-meaningful outcome — the charge point is out of the
 * caller's scope, or already released from a different tab — that the caller
 * needs to distinguish from a generic failure. Success carries no payload:
 * the backend answers 204, and the charge point simply drops out of this
 * caller's `getChargePoints()` list from then on.
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
   * Drops the caller's own membership on a charge point (charge-points-server
   * ADR 0028, issue #424) — the corrective path for a station claimed by the
   * wrong installer. Other members, if any, keep their access; when the
   * caller was the last one the charge point returns to unclaimed and is
   * detached from its site. A charge point outside the caller's scope, or
   * already released, is a 404 either way.
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
  /** Writes one setting by flat key — the write half of `getSettings` above. */
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

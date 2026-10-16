import type { ChargePoint, UpdateFirmwareStatusV201 } from "@watchborne/charge-points-types";

import type { ChargePointFirmware, FirmwareUpdateView } from "@/types/firmware";

import { withErrorLogging, withErrorLoggingAsync } from "./api-error-wrapper";
import type { CommandOutcome } from "./command-outcome";
import { fetchWithFreshSession, httpClient } from "./http-client";

/**
 * Same discriminated-result shape as `ResetChargePointOutcome`, plus one wrinkle
 * the other commands don't have: **`status` is `null` for an OCPP 1.6 station**.
 *
 * 1.6's `UpdateFirmware.conf` is an empty payload, so the station acknowledges
 * the frame without saying whether it will comply — the backend answers `202`
 * rather than `200` for exactly that reason. A `null` status therefore means
 * "requested, outcome unknown until the station reports", not "failed".
 */
export type StartFirmwareUpdateOutcome = CommandOutcome<{
  status: UpdateFirmwareStatusV201 | null;
  update: FirmwareUpdateView;
}>;

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

export const firmwareUpdateApis = {
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
    return withErrorLogging(
      () => httpClient.get<ChargePointFirmware>(`/api/charge-points/${chargePointId}/firmware`),
      "ChargePoint.getFirmware",
    );
  },
  /** The charge point's firmware update history, newest start first. */
  listFirmwareUpdates: async function (
    chargePointId: ChargePoint["id"],
    limit?: number,
  ): Promise<FirmwareUpdateView[]> {
    return withErrorLogging(() => {
      const query = limit === undefined ? "" : `?limit=${limit}`;
      return httpClient.get<FirmwareUpdateView[]>(
        `/api/charge-points/${chargePointId}/firmware-updates${query}`,
      );
    }, "ChargePoint.listFirmwareUpdates");
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
    return withErrorLoggingAsync(async () => {
      const response = await fetchWithFreshSession(`/api/charge-points/${chargePointId}/firmware`, {
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
    }, "ChargePoint.startFirmwareUpdate");
  },
};

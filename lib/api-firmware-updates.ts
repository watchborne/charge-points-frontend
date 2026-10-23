import type { ChargePoint, UpdateFirmwareStatusV201 } from "@watchborne/charge-points-types";

import type { ChargePointFirmware, FirmwareUpdateView } from "@/types/firmware";

import { withErrorLogging, withErrorLoggingAsync } from "./api-error-wrapper";
import type { CommandOutcome } from "./command-outcome";
import { fetchWithFreshSession, httpClient } from "./http-client";

/**
 * `status` is `null` for an OCPP 1.6 station: its `UpdateFirmware.conf` is
 * empty, so the backend answers 202 and the outcome is unknown until the
 * station reports. It means "requested", not "failed".
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
   * The update in flight and the last finished one. A plain read; out of
   * scope answers 200 with both fields `null`.
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
   * Starts a firmware update, reading the raw status to tell 200 (station
   * answered) from 202 (1.6 acknowledgment).
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

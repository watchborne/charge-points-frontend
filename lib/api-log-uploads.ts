import type {
  ChargePoint,
  GetLogStatusV201,
  GetLogTypeV201,
} from "@watchborne/charge-points-types";

import type { ChargePointLogUpload, LogUploadView } from "@/types/log-upload";

import { withErrorLogging, withErrorLoggingAsync } from "./api-error-wrapper";
import type { CommandOutcome } from "./command-outcome";
import { fetchWithFreshSession, httpClient } from "./http-client";

/**
 * Same discriminated-result shape as `StartFirmwareUpdateOutcome`, plus the
 * same wrinkle: **`status` is `null` for an OCPP 1.6 station**.
 *
 * 1.6's `GetDiagnostics.conf` reports only an optional `fileName`, no
 * accept/reject vocabulary at all — the backend answers `202` rather than
 * `200` for exactly that reason, same as `startFirmwareUpdate`. A `null`
 * status therefore means "requested, outcome unknown until the station
 * reports", not "failed".
 */
export type StartLogUploadOutcome = CommandOutcome<{
  status: GetLogStatusV201 | null;
  upload: LogUploadView;
}>;

/** What an installer fills in to start a log upload, before dialect translation. */
export type StartLogUploadBody = {
  logType: GetLogTypeV201;
  remoteLocation: string;
  oldestTimestamp?: string;
  latestTimestamp?: string;
};

export const logUploadApis = {
  /**
   * The charge point's remote-log-retrieval picture: the upload in flight and
   * the last finished one.
   *
   * A plain read, so it goes through `httpClient` like the other GETs — unlike
   * the OCPP commands above, there is no per-outcome HTTP status to
   * discriminate. The backend answers 200 even for a charge point outside the
   * caller's scope (both fields `null`), so there is no 404 to handle either.
   */
  getLogUpload: async function (chargePointId: ChargePoint["id"]): Promise<ChargePointLogUpload> {
    return withErrorLogging(
      () => httpClient.get<ChargePointLogUpload>(`/api/charge-points/${chargePointId}/log-upload`),
      "ChargePoint.getLogUpload",
    );
  },
  /** The charge point's log-upload history, newest start first. */
  listLogUploads: async function (
    chargePointId: ChargePoint["id"],
    limit?: number,
  ): Promise<LogUploadView[]> {
    return withErrorLogging(() => {
      const query = limit === undefined ? "" : `?limit=${limit}`;
      return httpClient.get<LogUploadView[]>(
        `/api/charge-points/${chargePointId}/log-uploads${query}`,
      );
    }, "ChargePoint.listLogUploads");
  },
  /**
   * Starts a remote log upload (OCPP `GetDiagnostics`/`GetLog`). Like the other
   * OCPP commands this reads the raw HTTP status rather than going through
   * `httpClient`, because the caller needs the specific outcome — and here also
   * needs to tell `200` (station answered) from `202` (1.6 station acknowledged
   * and said nothing).
   */
  startLogUpload: async function (
    chargePointId: ChargePoint["id"],
    body: StartLogUploadBody,
  ): Promise<StartLogUploadOutcome> {
    return withErrorLoggingAsync(async () => {
      const response = await fetchWithFreshSession(
        `/api/charge-points/${chargePointId}/log-upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (response.ok) {
        const { status, upload } = (await response.json()) as {
          status: GetLogStatusV201 | null;
          upload: LogUploadView;
        };
        return { ok: true, status, upload };
      }

      return { ok: false, httpStatus: response.status };
    }, "ChargePoint.startLogUpload");
  },
};

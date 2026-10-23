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
 * `status` is `null` for an OCPP 1.6 station: `GetDiagnostics.conf` has no
 * accept/reject, so the backend answers 202. It means "requested", not
 * "failed".
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
   * The upload in flight and the last finished one. A plain read; out of
   * scope answers 200 with both fields `null`.
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
   * Starts a remote log upload (`GetDiagnostics`/`GetLog`), reading the raw
   * status to tell 200 (station answered) from 202 (1.6 acknowledgment).
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

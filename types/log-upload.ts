import type { LogUpload } from "@watchborne/charge-points-types";

export {
  LOG_UPLOAD_OUTCOMES,
  type GetLogTypeV201,
  type LogUpload,
  type LogUploadOutcome,
  type LogUploadStep,
  type NormalizedLogStatus,
  isLogUploadInProgress,
  isTerminalLogStatus,
  logStatusOutcome,
} from "@watchborne/charge-points-types";

/**
 * A log upload as the backend's REST layer returns it: the shared domain
 * entity plus `isStalled`.
 *
 * `isStalled` lives here, not in `@watchborne/charge-points-types`, for the
 * same reason `FirmwareUpdateView.isStalled` does (see `types/firmware.ts`):
 * it's **derived at read time** from the age of the upload's last reported
 * step against a server-side threshold — a property of the API response,
 * not the entity. Putting it on `LogUploadSchema` would imply it's stored,
 * which it isn't.
 */
export type LogUploadView = LogUpload & { isStalled: boolean };

/** What `GET /api/charge-points/:id/log-upload` answers. */
export type ChargePointLogUpload = {
  /** The upload in flight, or `null` when the station isn't uploading one. */
  active: LogUploadView | null;
  /** The most recently finished upload, or `null` if never completed — answers
   * "when was a log last pulled, and did it work". */
  lastCompleted: LogUploadView | null;
};

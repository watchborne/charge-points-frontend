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
 * A log upload as the REST layer returns it, with `isStalled`: derived at read
 * time, so not part of the shared (stored) entity.
 */
export type LogUploadView = LogUpload & { isStalled: boolean };

/** What `GET /api/charge-points/:id/log-upload` answers. */
export type ChargePointLogUpload = {
  /** The upload in flight, or `null` when the station isn't uploading one. */
  active: LogUploadView | null;
  /** The most recently finished upload, or `null` if none. */
  lastCompleted: LogUploadView | null;
};

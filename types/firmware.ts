import type { FirmwareUpdate } from "@watchborne/charge-points-types";

export {
  FIRMWARE_UPDATE_PHASES,
  type FirmwareUpdate,
  type FirmwareUpdateOrigin,
  type FirmwareUpdateOutcome,
  type FirmwareUpdatePhase,
  type FirmwareUpdateStep,
  type NormalizedFirmwareStatus,
  firmwareStatusOutcome,
  firmwareStatusPhase,
  isFirmwareUpdateInProgress,
  isTerminalFirmwareStatus,
} from "@watchborne/charge-points-types";

/**
 * A firmware update as the backend's REST layer returns it: the shared domain
 * entity plus `isStalled`.
 *
 * `isStalled` deliberately lives here rather than in
 * `@watchborne/charge-points-types`: it is **derived at read time** from the age
 * of the update's last reported step against a server-side threshold, so it is a
 * property of the API response, not of the entity. Putting it on
 * `FirmwareUpdateSchema` would imply it is stored, which it never is.
 */
export type FirmwareUpdateView = FirmwareUpdate & { isStalled: boolean };

/** What `GET /api/charge-points/:id/firmware` answers. */
export type ChargePointFirmware = {
  /** The update in flight, or `null` when the station is not updating. */
  active: FirmwareUpdateView | null;
  /**
   * The most recently finished update, or `null` when the station has never
   * completed one — this is what answers "when was this charge point last
   * updated, and did it work".
   */
  lastCompleted: FirmwareUpdateView | null;
};

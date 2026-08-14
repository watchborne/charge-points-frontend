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
 * A firmware update as the backend's REST layer returns it: the shared
 * domain entity plus `isStalled`.
 *
 * `isStalled` lives here, not in `@watchborne/charge-points-types`: it's
 * **derived at read time** from the age of the update's last reported step
 * against a server-side threshold — a property of the API response, not the
 * entity. Putting it on `FirmwareUpdateSchema` would imply it's stored, which it isn't.
 */
export type FirmwareUpdateView = FirmwareUpdate & { isStalled: boolean };

/** What `GET /api/charge-points/:id/firmware` answers. */
export type ChargePointFirmware = {
  /** The update in flight, or `null` when the station is not updating. */
  active: FirmwareUpdateView | null;
  /** The most recently finished update, or `null` if never completed — answers
   * "when was this last updated, and did it work". */
  lastCompleted: FirmwareUpdateView | null;
};

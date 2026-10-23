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
 * A firmware update as the REST layer returns it, with `isStalled`: derived at
 * read time, so not part of the shared (stored) entity.
 */
export type FirmwareUpdateView = FirmwareUpdate & { isStalled: boolean };

/** What `GET /api/charge-points/:id/firmware` answers. */
export type ChargePointFirmware = {
  /** The update in flight, or `null` when the station is not updating. */
  active: FirmwareUpdateView | null;
  /** The most recently finished update, or `null` if none. */
  lastCompleted: FirmwareUpdateView | null;
};

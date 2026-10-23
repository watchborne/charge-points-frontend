/**
 * Result of a call whose caller needs the specific outcome (an OCPP command's
 * verdict, a precise HTTP failure). `httpClient` collapses every non-2xx, so
 * these methods read the raw status and return this instead of throwing.
 * `httpStatus` is 0 for a network failure.
 */
export type CommandOutcome<TOk extends object = object> =
  ({ ok: true } & TOk) | { ok: false; httpStatus: number };

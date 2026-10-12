/**
 * Result of a request/response call whose caller needs the specific outcome
 * (an OCPP command's station verdict, a precise HTTP failure) rather than a
 * generic thrown error. `httpClient` collapses every non-2xx into one generic
 * error, so the `lib/api-*.ts` methods that need more read the raw HTTP status
 * themselves and return this discriminated result instead of throwing.
 *
 * `TOk` is what a success carries (`{ status: ResetStatus }`, …); an empty
 * success is just `CommandOutcome`. `httpStatus` is 0 for a network failure
 * that never reached the proxy.
 */
export type CommandOutcome<TOk extends object = object> =
  ({ ok: true } & TOk) | { ok: false; httpStatus: number };

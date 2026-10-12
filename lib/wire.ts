/**
 * What a shared-package type looks like once it has crossed the wire as JSON:
 * every `Date` is an ISO string.
 *
 * The entity schemas in `@watchborne/charge-points-types` coerce timestamps to
 * `Date` (`z.coerce.date()`), but the `lib/api-*.ts` clients hand the parsed JSON
 * to the UI as is — timestamps are converted where they are rendered (see
 * `useDateFormat`), never widened to `Date` here. `Wire<T>` keeps that contract
 * honest while still deriving the shape from the package, so the dashboard's
 * types can't drift from the backend's response schema.
 */
export type Wire<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Wire<U>[]
    : T extends object
      ? { [K in keyof T]: Wire<T[K]> }
      : T;

/**
 * A shared-package type as it arrives in JSON: every `Date` is an ISO string.
 * The package coerces timestamps to `Date`, but the API clients pass the JSON
 * through and timestamps are converted where rendered; `Wire<T>` keeps the
 * type honest while deriving it from the package.
 */
export type Wire<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Wire<U>[]
    : T extends object
      ? { [K in keyof T]: Wire<T[K]> }
      : T;

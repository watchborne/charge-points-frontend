/**
 * Parses `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` into a Sentry `tracesSampleRate`.
 *
 * Falls back to `fallback` (1.0, i.e. every pageload/navigation — the value that
 * was hard-coded in the three `sentry.*` configs before this was tunable) when
 * the variable is unset, blank, not a number, or outside [0, 1]: a typo in an
 * env var should not silently turn tracing off or make Sentry.init throw.
 */
export const parseTracesSampleRate = (raw: string | undefined, fallback = 1): number => {
  if (raw === undefined || raw.trim() === "") return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 1) return fallback;

  return value;
};

import * as Sentry from "@sentry/nextjs";

/**
 * Reports an error the app caught and handled (a failed load, a dropped
 * WebSocket, a rejected push subscription) — the ones `app/global-error.tsx`
 * never sees, since that only catches React render errors. `context` is a short
 * stable label (`"useChargePoints.load"`) sent as a Sentry tag, so these can be
 * grouped and alerted on. A no-op for Sentry when `NEXT_PUBLIC_SENTRY_DSN` is
 * unset; outside production it also logs to the console, so the failure stays
 * visible in local devtools.
 */
export const reportError = (error: unknown, context: string): void => {
  Sentry.captureException(error, { tags: { context } });
  if (process.env.NODE_ENV !== "production") {
    console.error(`[${context}]`, error);
  }
};

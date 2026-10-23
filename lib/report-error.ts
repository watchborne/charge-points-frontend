import * as Sentry from "@sentry/nextjs";

// An error rethrown by `withErrorLogging` reaches a query hook's
// `useReportQueryError` as the same object: it is sent to Sentry once.
const reported = new WeakSet<object>();

/**
 * Reports an error the app caught and handled (render errors go to
 * `app/global-error.tsx`). `context` is a stable Sentry tag
 * (`"useChargePoints.load"`); an error object already reported keeps its first
 * context and is not sent again. Also logs to the console outside production.
 */
export const reportError = (error: unknown, context: string): void => {
  if (typeof error === "object" && error !== null) {
    if (reported.has(error)) return;
    reported.add(error);
  }
  Sentry.captureException(error, { tags: { context } });
  if (process.env.NODE_ENV !== "production") {
    console.error(`[${context}]`, error);
  }
};

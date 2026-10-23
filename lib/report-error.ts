import * as Sentry from "@sentry/nextjs";

import { HttpError } from "./http-error";

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

/**
 * Whether a caught API failure is worth reporting: a server error (5xx) or a
 * network error is; a 4xx is an answer the caller handles (validation,
 * conflict, inactive charge point, rate limit, expired session).
 */
export const isReportableError = (error: unknown): boolean =>
  !(error instanceof HttpError && error.status < 500);

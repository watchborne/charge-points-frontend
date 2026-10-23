import * as Sentry from "@sentry/nextjs";

/**
 * Reports an error the app caught and handled (render errors go to
 * `app/global-error.tsx`). `context` is a stable Sentry tag
 * (`"useChargePoints.load"`). Also logs to the console outside production.
 */
export const reportError = (error: unknown, context: string): void => {
  Sentry.captureException(error, { tags: { context } });
  if (process.env.NODE_ENV !== "production") {
    console.error(`[${context}]`, error);
  }
};

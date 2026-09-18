import * as Sentry from "@sentry/nextjs";

/**
 * Wraps async API operations with consistent error logging and handling.
 * Reduces duplicated try/catch and Sentry error capture patterns across API files.
 */
export async function withErrorLogging<T>(
  operation: () => Promise<T>,
  context: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    Sentry.captureException(error, { tags: { api: context } });
    throw error;
  }
}

/**
 * Variant for fetch-based operations that return discriminated results
 * (ok: true/false) rather than throwing on non-2xx responses.
 */
export async function withErrorLoggingAsync<T extends { ok: boolean; httpStatus?: number }>(
  operation: () => Promise<T>,
  context: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    Sentry.captureException(error, { tags: { api: context, type: "NetworkError" } });
    return { ok: false, httpStatus: 0 } as T;
  }
}

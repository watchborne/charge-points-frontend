import { isReportableError, reportError } from "./report-error";

/** Runs an async API call, reporting a server or network failure before rethrowing it. */
export async function withErrorLogging<T>(
  operation: () => Promise<T>,
  context: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isReportableError(error)) reportError(error, context);
    throw error;
  }
}

/**
 * The same, for calls returning a discriminated `{ ok }` result: they read the
 * HTTP status themselves, so only a network error is thrown here, reported and
 * turned into `httpStatus: 0`.
 */
export async function withErrorLoggingAsync<T extends { ok: boolean; httpStatus?: number }>(
  operation: () => Promise<T>,
  context: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    reportError(error, context);
    return { ok: false, httpStatus: 0 } as T;
  }
}

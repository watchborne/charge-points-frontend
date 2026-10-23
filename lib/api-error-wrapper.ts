/** Runs an async API call with consistent error logging. */
export async function withErrorLogging<T>(
  operation: () => Promise<T>,
  context: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`[${context}] Failed:`, error);
    throw error;
  }
}

/** The same, for calls returning a discriminated `{ ok }` result. */
export async function withErrorLoggingAsync<T extends { ok: boolean; httpStatus?: number }>(
  operation: () => Promise<T>,
  context: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`[${context}] Network error:`, error);
    return { ok: false, httpStatus: 0 } as T;
  }
}

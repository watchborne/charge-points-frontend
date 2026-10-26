import { afterEach, describe, expect, it, vi } from "vitest";

const { reportError } = vi.hoisted(() => ({ reportError: vi.fn() }));

vi.mock("../report-error", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../report-error")>()),
  reportError,
}));

import { withErrorLogging, withErrorLoggingAsync } from "../api-error-wrapper";
import { HttpError } from "../http-error";

describe("withErrorLogging", () => {
  afterEach(() => {
    reportError.mockReset();
  });

  it("SHOULD return the result WHEN the call succeeds", async () => {
    expect(await withErrorLogging(async () => 42, "ctx")).toBe(42);
    expect(reportError).not.toHaveBeenCalled();
  });

  it("SHOULD report and rethrow WHEN the call fails with a network error", async () => {
    const error = new TypeError("Failed to fetch");

    await expect(withErrorLogging(() => Promise.reject(error), "ChargePoint.reset")).rejects.toBe(
      error,
    );
    expect(reportError).toHaveBeenCalledWith(error, "ChargePoint.reset");
  });

  it("SHOULD report and rethrow WHEN the server answers 5xx", async () => {
    const error = new HttpError(502, null);

    await expect(withErrorLogging(() => Promise.reject(error), "Sites.getSites")).rejects.toBe(
      error,
    );
    expect(reportError).toHaveBeenCalledWith(error, "Sites.getSites");
  });

  // A 409 on an inactive charge point or a 401 on an expired session is an
  // expected answer the caller turns into a message, not a failure to monitor.
  it("SHOULD rethrow without reporting WHEN the server answers 4xx", async () => {
    const error = new HttpError(409, { code: "INACTIVE" });

    await expect(withErrorLogging(() => Promise.reject(error), "ctx")).rejects.toBe(error);
    expect(reportError).not.toHaveBeenCalled();
  });
});

describe("withErrorLoggingAsync", () => {
  afterEach(() => {
    reportError.mockReset();
  });

  it("SHOULD return the outcome WHEN the call resolves", async () => {
    const outcome = { ok: false as const, httpStatus: 409 };

    expect(await withErrorLoggingAsync(async () => outcome, "ctx")).toBe(outcome);
    expect(reportError).not.toHaveBeenCalled();
  });

  it("SHOULD report the error and answer httpStatus 0 WHEN the call throws", async () => {
    const error = new TypeError("Failed to fetch");

    expect(await withErrorLoggingAsync(() => Promise.reject(error), "ChargePoint.unlock")).toEqual({
      ok: false,
      httpStatus: 0,
    });
    expect(reportError).toHaveBeenCalledWith(error, "ChargePoint.unlock");
  });
});

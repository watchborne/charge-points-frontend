import { afterEach, describe, expect, it, vi } from "vitest";

const { captureException } = vi.hoisted(() => ({ captureException: vi.fn() }));

vi.mock("@sentry/nextjs", () => ({ captureException }));

import { HttpError } from "../http-error";
import { isReportableError, reportError } from "../report-error";

describe("reportError", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    captureException.mockReset();
  });

  it("SHOULD send the error to Sentry tagged with its context", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = new Error("boom");

    reportError(error, "useSites.load");

    expect(captureException).toHaveBeenCalledWith(error, { tags: { context: "useSites.load" } });
  });

  it("SHOULD also log to the console WHEN not in production", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    reportError("oops", "ctx");

    expect(spy).toHaveBeenCalledWith("[ctx]", "oops");
  });

  it("SHOULD NOT log to the console WHEN in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    reportError("oops", "ctx");

    expect(spy).not.toHaveBeenCalled();
    expect(captureException).toHaveBeenCalled();
  });

  // An API failure is reported by withErrorLogging, then again by the query
  // hook that receives the same rethrown error.
  it("SHOULD send an error object once WHEN it is reported twice", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = new Error("boom");

    reportError(error, "Sites.getSites");
    reportError(error, "useSites.load");

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(error, { tags: { context: "Sites.getSites" } });
  });

  it("SHOULD send each report WHEN the error is not an object", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    reportError("oops", "ctx");
    reportError("oops", "ctx");

    expect(captureException).toHaveBeenCalledTimes(2);
  });
});

describe("isReportableError", () => {
  it("SHOULD be true WHEN the error is a network error", () => {
    expect(isReportableError(new TypeError("Failed to fetch"))).toBe(true);
  });

  it("SHOULD be true WHEN the server answered 5xx", () => {
    expect(isReportableError(new HttpError(503, null))).toBe(true);
  });

  it("SHOULD be false WHEN the server answered 4xx", () => {
    expect(isReportableError(new HttpError(429, { code: "RATE_LIMITED" }))).toBe(false);
  });
});

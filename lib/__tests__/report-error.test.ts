import { afterEach, describe, expect, it, vi } from "vitest";

const { captureException } = vi.hoisted(() => ({ captureException: vi.fn() }));

vi.mock("@sentry/nextjs", () => ({ captureException }));

import { reportError } from "../report-error";

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
});

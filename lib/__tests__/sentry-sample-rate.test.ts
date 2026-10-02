import { describe, expect, it } from "vitest";

import { parseTracesSampleRate } from "../sentry-sample-rate";

describe("parseTracesSampleRate", () => {
  it("SHOULD return the fallback WHEN the variable is unset or blank", () => {
    expect(parseTracesSampleRate(undefined)).toBe(1);
    expect(parseTracesSampleRate("")).toBe(1);
    expect(parseTracesSampleRate("   ")).toBe(1);
  });

  it("SHOULD return the parsed rate WHEN it is within [0, 1]", () => {
    expect(parseTracesSampleRate("0.1")).toBe(0.1);
    expect(parseTracesSampleRate("0")).toBe(0);
    expect(parseTracesSampleRate("1")).toBe(1);
  });

  it("SHOULD return the fallback WHEN the value is not a usable rate", () => {
    expect(parseTracesSampleRate("abc")).toBe(1);
    expect(parseTracesSampleRate("1.5")).toBe(1);
    expect(parseTracesSampleRate("-0.2")).toBe(1);
    expect(parseTracesSampleRate("Infinity")).toBe(1);
  });

  it("SHOULD honour a custom fallback", () => {
    expect(parseTracesSampleRate(undefined, 0.1)).toBe(0.1);
  });
});

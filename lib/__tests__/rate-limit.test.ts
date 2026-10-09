import { describe, expect, it } from "vitest";

import { createRateLimiter, getClientIp } from "../rate-limit";

describe("createRateLimiter", () => {
  it("SHOULD reject with the remaining wait WHEN a key exceeds max within the window", () => {
    const limiter = createRateLimiter({ max: 2, windowMs: 60_000 });

    expect(limiter.check("a", 0)).toEqual({ allowed: true });
    expect(limiter.check("a", 1_000)).toEqual({ allowed: true });
    expect(limiter.check("a", 2_000)).toEqual({ allowed: false, retryAfterSeconds: 58 });
  });

  it("SHOULD count keys independently", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });

    limiter.check("a", 0);

    expect(limiter.check("b", 0)).toEqual({ allowed: true });
  });

  it("SHOULD allow again WHEN the window has elapsed", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });

    limiter.check("a", 0);

    expect(limiter.check("a", 60_000)).toEqual({ allowed: true });
  });
});

describe("getClientIp", () => {
  it("SHOULD prefer the edge-set header over x-forwarded-for", () => {
    const headers = new Headers({
      "x-nf-client-connection-ip": "203.0.113.9",
      "x-forwarded-for": "198.51.100.1",
    });

    expect(getClientIp(headers)).toBe("203.0.113.9");
  });

  it("SHOULD use the first x-forwarded-for entry WHEN no edge header is set", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" }))).toBe(
      "198.51.100.1",
    );
  });

  it("SHOULD fall back to a shared key WHEN no address header exists", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

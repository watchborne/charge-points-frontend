import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock only the external @supabase/ssr (a bare specifier — reliably intercepted).
// The real lib/supabase/middleware + root proxy run against it, so the guard
// logic and cookie handling are exercised for real. `getUser` is controlled per test.
const { createServerClient, getUser } = vi.hoisted(() => {
  const getUser = vi.fn();
  return {
    getUser,
    createServerClient: vi.fn(() => ({ auth: { getUser } })),
  };
});

vi.mock("@supabase/ssr", () => ({ createServerClient }));

// next-intl/middleware's ESM build imports "next/server" in a way Vitest's
// Node-ESM resolver can't follow outside a real Next.js build (confirmed
// working under `next build`/`next start`) — a test-tooling gap, not a
// runtime bug. Mocked here so this file can focus on what's actually ours to
// test: the auth-gating/redirect logic layered around next-intl's routing,
// not next-intl's own URL-prefix algorithm (that's next-intl's job to test).
// Defaults to a passthrough; the "locale routing" describe block below swaps
// in a redirect for the one scenario that needs it.
const { intlMiddlewareImpl } = vi.hoisted(() => ({
  intlMiddlewareImpl: { current: null as ((request: NextRequest) => NextResponse) | null },
}));

vi.mock("next-intl/middleware", () => ({
  default: () => (request: NextRequest) =>
    intlMiddlewareImpl.current?.(request) ?? NextResponse.next({ request }),
}));

function setUser(user: { id: string } | null) {
  getUser.mockResolvedValue({ data: { user } });
}

function request(path: string) {
  return new NextRequest(`http://localhost:3001${path}`);
}

function requestFromHost(host: string, path: string) {
  return new NextRequest(`http://localhost:3001${path}`, { headers: { host } });
}

beforeEach(() => {
  vi.resetModules();
  createServerClient.mockClear();
  getUser.mockReset();
  intlMiddlewareImpl.current = null;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("proxy auth guard", () => {
  it("SHOULD return 401 for /api/* WHEN there is no session", async () => {
    setUser(null);
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/api/charge-points"));

    expect(res.status).toBe(401);
  });

  it("SHOULD let /api/* through WHEN there is a session", async () => {
    setUser({ id: "user-1" });
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/api/charge-points"));

    expect(res.status).not.toBe(401);
    expect(res.headers.get("location")).toBeNull();
  });

  it("SHOULD let the public /api/access-requests route through WHEN there is no session", async () => {
    setUser(null);
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/api/access-requests"));

    // The alpha access request is submitted by an unauthenticated visitor, so
    // this endpoint is exempt from the /api/* session gate (no 401).
    expect(res.status).not.toBe(401);
  });

  it("SHOULD let the public /api/access-requests/check-login route through WHEN there is no session", async () => {
    setUser(null);
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/api/access-requests/check-login"));

    // LoginForm calls this before the visitor has a session — that's the
    // whole point of it — so it must be exempt too (charge-points-server ADR
    // 0006).
    expect(res.status).not.toBe(401);
  });

  it("SHOULD let the public /api/access-requests/verify-email route through WHEN there is no session", async () => {
    setUser(null);
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/api/access-requests/verify-email"));

    // The confirmation link's destination, reachable before approval, let
    // alone a session (charge-points-server ADR 0007).
    expect(res.status).not.toBe(401);
  });

  it("SHOULD redirect /app/* to /login WHEN there is no session", async () => {
    setUser(null);
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/app/dashboard"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("SHOULD redirect a locale-prefixed /app/* to the same locale's /login WHEN there is no session", async () => {
    setUser(null);
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/en/app/dashboard"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3001/en/login");
  });

  it("SHOULD let /app/* through WHEN there is a session", async () => {
    setUser({ id: "user-1" });
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/app/dashboard"));

    expect(res.headers.get("location")).toBeNull();
  });

  it("SHOULD redirect /login to the dashboard WHEN already authenticated", async () => {
    setUser({ id: "user-1" });
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/login"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3001/app/dashboard");
  });

  it("SHOULD let /login through WHEN there is no session", async () => {
    setUser(null);
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/login"));

    expect(res.headers.get("location")).toBeNull();
  });
});

describe("proxy auth guard resilience", () => {
  // @supabase/auth-js's getUser() rethrows anything that isn't an AuthError
  // (e.g. a raw network failure reaching Supabase) instead of resolving with
  // { user: null }. Left uncaught, that crashes the whole Netlify Edge
  // Function invocation for the request. These fail-closed instead: treat a
  // rejected getUser() the same as no session.
  beforeEach(() => {
    getUser.mockRejectedValue(new Error("fetch failed"));
  });

  it("SHOULD redirect /app/* to /login WHEN supabase.auth.getUser() throws", async () => {
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/app/dashboard"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("SHOULD return 401 for /api/* WHEN supabase.auth.getUser() throws", async () => {
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/api/charge-points"));

    expect(res.status).toBe(401);
  });

  it("SHOULD still render /login WHEN supabase.auth.getUser() throws", async () => {
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/login"));

    expect(res.status).not.toBe(401);
    expect(res.headers.get("location")).toBeNull();
  });
});

describe(".fr host redirect", () => {
  it("SHOULD redirect to .com WHEN the host is watch-borne.fr", async () => {
    setUser(null);
    const { proxy } = await import("../../proxy");

    const res = await proxy(requestFromHost("watch-borne.fr", "/pricing?ref=footer"));

    expect(res.status).toBe(308);
    // No ?lang= forcing any more: an unprefixed path on .com already means fr,
    // the default locale (see i18n/routing.ts).
    expect(res.headers.get("location")).toBe("http://watch-borne.com/pricing?ref=footer");
  });

  it("SHOULD NOT redirect WHEN the host is already watch-borne.com", async () => {
    setUser({ id: "user-1" });
    const { proxy } = await import("../../proxy");

    const res = await proxy(requestFromHost("watch-borne.com", "/pricing"));

    expect(res.status).not.toBe(308);
  });
});

describe("locale routing", () => {
  // next-intl's own URL-prefix algorithm (as-needed, fr unprefixed / en
  // prefixed) is next-intl's responsibility to test, not ours — see the
  // vi.mock("next-intl/middleware", ...) comment above. What's ours to get
  // right is: (1) a redirect from next-intl short-circuits immediately
  // without running the Supabase auth gate, and (2) a non-redirect response
  // proceeds through gating as normal, on both prefixed and unprefixed paths.

  it("SHOULD return next-intl's redirect immediately WITHOUT running the auth gate", async () => {
    setUser(null);
    intlMiddlewareImpl.current = (req) => NextResponse.redirect(new URL("/pricing", req.url), 307);
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/fr/pricing"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3001/pricing");
    // /fr/pricing isn't an auth-gated path anyway, but the point stands for
    // /app/* and /login too: a redirect is returned as-is, before gating.
    expect(getUser).not.toHaveBeenCalled();
  });

  it("SHOULD proceed to auth gating WHEN next-intl does not redirect", async () => {
    setUser(null);
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/app/dashboard"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3001/login");
  });
});

describe("Supabase session lookup scoping", () => {
  it("SHOULD NOT hit Supabase for a public marketing page", async () => {
    setUser(null);
    const { proxy } = await import("../../proxy");

    await proxy(request("/pricing"));

    // No Supabase client is constructed and no getUser round-trip happens for
    // marketing routes — the whole point of the optimization.
    expect(createServerClient).not.toHaveBeenCalled();
    expect(getUser).not.toHaveBeenCalled();
  });

  it("SHOULD hit Supabase for an /app route", async () => {
    setUser({ id: "user-1" });
    const { proxy } = await import("../../proxy");

    await proxy(request("/app/dashboard"));

    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it("SHOULD hit Supabase for an /api route", async () => {
    setUser({ id: "user-1" });
    const { proxy } = await import("../../proxy");

    await proxy(request("/api/charge-points"));

    expect(getUser).toHaveBeenCalledTimes(1);
  });
});

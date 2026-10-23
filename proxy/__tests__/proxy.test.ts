import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// @supabase/ssr is mocked; the real lib/supabase/middleware and proxy run
// against it. `getUser` is controlled per test.
const { createServerClient, getUser } = vi.hoisted(() => {
  const getUser = vi.fn();
  return {
    getUser,
    createServerClient: vi.fn(() => ({ auth: { getUser } })),
  };
});

vi.mock("@supabase/ssr", () => ({ createServerClient }));

// next-intl/middleware's ESM build can't be resolved by Vitest outside a Next
// build, so it is mocked as a passthrough: only our gating around it is
// tested. The "locale routing" block swaps in a redirect.
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
  // /api/* isn't gated here: the backend verifies the token itself. The proxy
  // neither answers nor calls Supabase on /api.
  it("SHOULD let /api/* through WHEN there is no session", async () => {
    setUser(null);
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/api/charge-points"));

    expect(res.status).not.toBe(401);
    expect(res.headers.get("location")).toBeNull();
  });

  it("SHOULD let /api/* through WHEN there is a session", async () => {
    setUser({ id: "user-1" });
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/api/charge-points"));

    expect(res.status).not.toBe(401);
    expect(res.headers.get("location")).toBeNull();
  });

  // Reachable without a session: the access request (submitted
  // unauthenticated), check-login (before a session exists) and verify-email
  // (the confirmation link).
  it.each([
    "/api/access-requests",
    "/api/access-requests/check-login",
    "/api/access-requests/verify-email",
  ])("SHOULD let the public %s route through WHEN there is no session", async (path) => {
    setUser(null);
    const { proxy } = await import("../../proxy");

    const res = await proxy(request(path));

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
  // getUser() rethrows non-auth errors (e.g. a network failure), which would
  // crash the edge function. Fail closed: treat it as no session.
  beforeEach(() => {
    getUser.mockRejectedValue(new Error("fetch failed"));
  });

  it("SHOULD redirect /app/* to /login WHEN supabase.auth.getUser() throws", async () => {
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/app/dashboard"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("SHOULD let /api/* through WHEN supabase.auth.getUser() throws", async () => {
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/api/charge-points"));

    // The proxy doesn't consult Supabase on /api, so the request still reaches
    // the backend.
    expect(res.status).not.toBe(401);
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
    // An unprefixed path on .com already means fr.
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
  // next-intl's prefixing is its own to test. Ours: a next-intl redirect
  // returns before the auth gate, and other responses go through gating, on
  // prefixed and unprefixed paths.

  it("SHOULD return next-intl's redirect immediately WITHOUT running the auth gate", async () => {
    setUser(null);
    intlMiddlewareImpl.current = (req) => NextResponse.redirect(new URL("/pricing", req.url), 307);
    const { proxy } = await import("../../proxy");

    const res = await proxy(request("/fr/pricing"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3001/pricing");
    // Holds for /app/* and /login too: a redirect returns before gating.
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

describe("middleware matcher", () => {
  // A public/ asset not excluded here would be rewritten by next-intl and
  // served as a 404 page (e.g. /sw.js, rejected for its MIME type).
  it.each([
    "/sw.js",
    "/manifest.json",
    "/icon-192.png",
    "/icon-512.png",
    "/icon-maskable-512.png",
    "/favicon.svg",
    "/favicon.ico",
    "/apple-touch-icon.png",
    "/_next/static/chunks/main.js",
    "/_next/image",
  ])("SHOULD exclude the static asset path %s from the matcher", async (path) => {
    const { config } = await import("../../proxy");
    const pattern = new RegExp(`^${config.matcher[0]}$`);

    expect(pattern.test(path)).toBe(false);
  });

  it.each(["/app/dashboard", "/api/charge-points", "/pricing", "/login", "/en/pricing"])(
    "SHOULD still route %s through the matcher",
    async (path) => {
      const { config } = await import("../../proxy");
      const pattern = new RegExp(`^${config.matcher[0]}$`);

      expect(pattern.test(path)).toBe(true);
    },
  );
});

describe("Supabase session lookup scoping", () => {
  it("SHOULD NOT hit Supabase for a public marketing page", async () => {
    setUser(null);
    const { proxy } = await import("../../proxy");

    await proxy(request("/pricing"));

    // No Supabase client or getUser round trip for marketing routes.
    expect(createServerClient).not.toHaveBeenCalled();
    expect(getUser).not.toHaveBeenCalled();
  });

  it("SHOULD hit Supabase for an /app route", async () => {
    setUser({ id: "user-1" });
    const { proxy } = await import("../../proxy");

    await proxy(request("/app/dashboard"));

    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it("SHOULD NOT hit Supabase for an /api route", async () => {
    setUser({ id: "user-1" });
    const { proxy } = await import("../../proxy");

    await proxy(request("/api/charge-points"));

    // The backend verifies the token itself; asserted directly since a
    // regression would only show as latency.
    expect(createServerClient).not.toHaveBeenCalled();
    expect(getUser).not.toHaveBeenCalled();
  });
});

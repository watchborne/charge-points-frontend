import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock only the external @supabase/ssr (a bare specifier — reliably intercepted).
// The real lib/supabase/middleware + root middleware run against it, so the guard
// logic and cookie handling are exercised for real. `getUser` is controlled per test.
const { createServerClient, getUser } = vi.hoisted(() => {
  const getUser = vi.fn();
  return {
    getUser,
    createServerClient: vi.fn(() => ({ auth: { getUser } })),
  };
});

vi.mock("@supabase/ssr", () => ({ createServerClient }));

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
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("middleware auth guard", () => {
  it("returns 401 for /api/* without a session", async () => {
    setUser(null);
    const { middleware } = await import("../../middleware");

    const res = await middleware(request("/api/charge-points"));

    expect(res.status).toBe(401);
  });

  it("lets /api/* through with a session", async () => {
    setUser({ id: "user-1" });
    const { middleware } = await import("../../middleware");

    const res = await middleware(request("/api/charge-points"));

    expect(res.status).not.toBe(401);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects /app/* to /login without a session", async () => {
    setUser(null);
    const { middleware } = await import("../../middleware");

    const res = await middleware(request("/app/dashboard"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("lets /app/* through with a session", async () => {
    setUser({ id: "user-1" });
    const { middleware } = await import("../../middleware");

    const res = await middleware(request("/app/dashboard"));

    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects /login to the dashboard when already authenticated", async () => {
    setUser({ id: "user-1" });
    const { middleware } = await import("../../middleware");

    const res = await middleware(request("/login"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3001/app/dashboard");
  });

  it("lets /login through without a session", async () => {
    setUser(null);
    const { middleware } = await import("../../middleware");

    const res = await middleware(request("/login"));

    expect(res.headers.get("location")).toBeNull();
  });
});

describe("app-host rewrite", () => {
  it("rewrites a bare path on an app.* host into /app/*", async () => {
    setUser({ id: "user-1" });
    const { middleware } = await import("../../middleware");

    const res = await middleware(requestFromHost("app.watch-borne.com", "/dashboard"));

    expect(new URL(res.headers.get("x-middleware-rewrite")!).pathname).toBe("/app/dashboard");
  });

  it("guards the rewritten path as an /app route (redirects to /login without a session)", async () => {
    setUser(null);
    const { middleware } = await import("../../middleware");

    const res = await middleware(requestFromHost("app.watch-borne.com", "/dashboard"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("does not double-prefix a path that already starts with /app", async () => {
    setUser({ id: "user-1" });
    const { middleware } = await import("../../middleware");

    const res = await middleware(requestFromHost("app.watch-borne.com", "/app/dashboard"));

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("does not rewrite /api on an app.* host (API routes live outside app/app/)", async () => {
    setUser({ id: "user-1" });
    const { middleware } = await import("../../middleware");

    const res = await middleware(requestFromHost("app.watch-borne.com", "/api/charge-points"));

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.status).not.toBe(401);
  });

  it("does not rewrite /login on an app.* host", async () => {
    setUser(null);
    const { middleware } = await import("../../middleware");

    const res = await middleware(requestFromHost("app.watch-borne.com", "/login"));

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("does not rewrite paths on a non-app host", async () => {
    setUser({ id: "user-1" });
    const { middleware } = await import("../../middleware");

    const res = await middleware(requestFromHost("watch-borne.com", "/dashboard"));

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });
});

describe("locale resolution", () => {
  it("SHOULD default the NEXT_LOCALE cookie to fr WHEN there is no lang param or cookie", async () => {
    setUser(null);
    const { middleware } = await import("../../middleware");

    const res = await middleware(request("/pricing"));

    expect(res.cookies.get("NEXT_LOCALE")?.value).toBe("fr");
  });

  it("SHOULD set NEXT_LOCALE to fr WHEN the host is watch-borne.fr", async () => {
    setUser({ id: "user-1" });
    const { middleware } = await import("../../middleware");

    const res = await middleware(requestFromHost("watch-borne.fr", "/"));

    expect(res.cookies.get("NEXT_LOCALE")?.value).toBe("fr");
  });

  it("SHOULD set NEXT_LOCALE to en WHEN the host is watch-borne.com", async () => {
    setUser({ id: "user-1" });
    const { middleware } = await import("../../middleware");

    const res = await middleware(requestFromHost("watch-borne.com", "/"));

    expect(res.cookies.get("NEXT_LOCALE")?.value).toBe("en");
  });

  it("SHOULD set NEXT_LOCALE to en WHEN the host is the app.*.com subdomain", async () => {
    setUser({ id: "user-1" });
    const { middleware } = await import("../../middleware");

    const res = await middleware(requestFromHost("app.watch-borne.com", "/dashboard"));

    expect(res.cookies.get("NEXT_LOCALE")?.value).toBe("en");
  });

  it("SHOULD set the NEXT_LOCALE cookie from the lang query param WHEN it is a supported locale", async () => {
    setUser(null);
    const { middleware } = await import("../../middleware");

    const res = await middleware(request("/pricing?lang=en"));

    expect(res.cookies.get("NEXT_LOCALE")?.value).toBe("en");
  });

  it("SHOULD ignore an unsupported lang query param WHEN falling back to the cookie", async () => {
    setUser(null);
    const { middleware } = await import("../../middleware");

    const req = request("/pricing?lang=de");
    req.cookies.set("NEXT_LOCALE", "en");

    const res = await middleware(req);

    expect(res.cookies.get("NEXT_LOCALE")?.value).toBe("en");
  });

  it("SHOULD keep the existing NEXT_LOCALE cookie WHEN no lang query param is present", async () => {
    setUser(null);
    const { middleware } = await import("../../middleware");

    const req = request("/pricing");
    req.cookies.set("NEXT_LOCALE", "en");

    const res = await middleware(req);

    expect(res.cookies.get("NEXT_LOCALE")?.value).toBe("en");
  });

  it("SHOULD let a lang query param override an existing NEXT_LOCALE cookie", async () => {
    setUser(null);
    const { middleware } = await import("../../middleware");

    const req = request("/pricing?lang=en");
    req.cookies.set("NEXT_LOCALE", "fr");

    const res = await middleware(req);

    expect(res.cookies.get("NEXT_LOCALE")?.value).toBe("en");
  });
});

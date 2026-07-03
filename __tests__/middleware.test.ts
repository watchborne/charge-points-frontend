import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

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
    const { middleware } = await import("../middleware");

    const res = await middleware(request("/api/charge-points"));

    expect(res.status).toBe(401);
  });

  it("lets /api/* through with a session", async () => {
    setUser({ id: "user-1" });
    const { middleware } = await import("../middleware");

    const res = await middleware(request("/api/charge-points"));

    expect(res.status).not.toBe(401);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects /app/* to /login without a session", async () => {
    setUser(null);
    const { middleware } = await import("../middleware");

    const res = await middleware(request("/app/dashboard"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("lets /app/* through with a session", async () => {
    setUser({ id: "user-1" });
    const { middleware } = await import("../middleware");

    const res = await middleware(request("/app/dashboard"));

    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects /login to the dashboard when already authenticated", async () => {
    setUser({ id: "user-1" });
    const { middleware } = await import("../middleware");

    const res = await middleware(request("/login"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3001/app/dashboard");
  });

  it("lets /login through without a session", async () => {
    setUser(null);
    const { middleware } = await import("../middleware");

    const res = await middleware(request("/login"));

    expect(res.headers.get("location")).toBeNull();
  });
});

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the bare `@supabase/ssr` specifier (reliably intercepted, unlike a
// "@/..." aliased mock) so the real `lib/supabase/middleware` client factory
// runs against a stubbed server client whose `getUser` we control per test.
const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ auth: { getUser } })),
}));

import { middleware } from "../middleware";

const asUnauthenticated = () => getUser.mockResolvedValue({ data: { user: null } });
const asAuthenticated = () => getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

beforeEach(() => {
  vi.resetModules();
  getUser.mockReset();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("middleware — stray PKCE `code` param", () => {
  it("SHOULD forward the code to /auth/callback WHEN it lands on a non-callback path", async () => {
    asUnauthenticated();

    const res = await middleware(new NextRequest("http://localhost:3001/?code=abc123"));

    expect(res.headers.get("location")).toBe("http://localhost:3001/auth/callback?code=abc123");
  });

  it("SHOULD forward the code to /auth/callback WHEN it lands on the dashboard", async () => {
    asAuthenticated();

    const res = await middleware(
      new NextRequest("http://localhost:3001/app/dashboard?code=abc123"),
    );

    expect(res.headers.get("location")).toBe("http://localhost:3001/auth/callback?code=abc123");
  });

  it("SHOULD NOT redirect WHEN the request is already on /auth/callback", async () => {
    asUnauthenticated();

    const res = await middleware(
      new NextRequest("http://localhost:3001/auth/callback?code=abc123"),
    );

    // Passes through to the callback route rather than looping back to itself.
    expect(res.headers.get("location")).toBeNull();
  });

  it("SHOULD NOT touch a request that carries no code", async () => {
    asAuthenticated();

    const res = await middleware(new NextRequest("http://localhost:3001/app/dashboard"));

    expect(res.headers.get("location")).toBeNull();
  });
});

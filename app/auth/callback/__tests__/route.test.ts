import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerClient, exchangeCodeForSession } = vi.hoisted(() => {
  const exchangeCodeForSession = vi.fn();
  return {
    exchangeCodeForSession,
    createServerClient: vi.fn(() => ({ auth: { exchangeCodeForSession } })),
  };
});

// Both mocked specifiers are external/bare (@supabase/ssr, next/headers), not path
// aliases — those are reliably intercepted, unlike "@/..." aliased mocks.
vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("next/headers", () => ({
  cookies: () => ({ getAll: () => [], set: vi.fn() }),
}));

import { GET } from "../route";

beforeEach(() => {
  exchangeCodeForSession.mockReset();
});

describe("GET /auth/callback", () => {
  it("verifies the code and redirects to the dashboard on success", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const res = await GET(new NextRequest("http://localhost:3001/auth/callback?code=abc123"));

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(res.headers.get("location")).toBe("http://localhost:3001/app/dashboard");
  });

  it("redirects to /login when the token verification fails", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "expired" } });

    const res = await GET(new NextRequest("http://localhost:3001/auth/callback?code=stale"));

    expect(res.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("redirects to /login when code is missing", async () => {
    const res = await GET(new NextRequest("http://localhost:3001/auth/callback"));

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe("http://localhost:3001/login");
  });
});

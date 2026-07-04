import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createServerClient, verifyOtp } = vi.hoisted(() => {
  const verifyOtp = vi.fn();
  return {
    verifyOtp,
    createServerClient: vi.fn(() => ({ auth: { verifyOtp } })),
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
  verifyOtp.mockReset();
});

describe("GET /auth/callback", () => {
  it("verifies the token hash and redirects to the dashboard on success", async () => {
    verifyOtp.mockResolvedValue({ error: null });

    const res = await GET(
      new NextRequest("http://localhost:3001/auth/callback?token_hash=abc123&type=magiclink"),
    );

    expect(verifyOtp).toHaveBeenCalledWith({ type: "magiclink", token_hash: "abc123" });
    expect(res.headers.get("location")).toBe("http://localhost:3001/app/dashboard");
  });

  it("redirects to /login when the token verification fails", async () => {
    verifyOtp.mockResolvedValue({ error: { message: "expired" } });

    const res = await GET(
      new NextRequest("http://localhost:3001/auth/callback?token_hash=stale&type=magiclink"),
    );

    expect(res.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("redirects to /login when token_hash is missing", async () => {
    const res = await GET(new NextRequest("http://localhost:3001/auth/callback?type=magiclink"));

    expect(verifyOtp).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("redirects to /login when type is missing", async () => {
    const res = await GET(new NextRequest("http://localhost:3001/auth/callback?token_hash=abc123"));

    expect(verifyOtp).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe("http://localhost:3001/login");
  });
});

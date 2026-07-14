import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClient: createAdminSupabaseClient, generateLink } = vi.hoisted(() => {
  const generateLink = vi.fn();
  return {
    generateLink,
    createClient: vi.fn(() => ({ auth: { admin: { generateLink } } })),
  };
});

const { createServerClient, verifyOtp } = vi.hoisted(() => {
  const verifyOtp = vi.fn();
  return {
    verifyOtp,
    createServerClient: vi.fn(() => ({ auth: { verifyOtp } })),
  };
});

vi.mock("@supabase/supabase-js", () => ({ createClient: createAdminSupabaseClient }));
vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("next/headers", () => ({
  cookies: () => ({ getAll: () => [], set: vi.fn() }),
}));

import { GET } from "../route";

beforeEach(() => {
  generateLink.mockReset();
  verifyOtp.mockReset();
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /auth/dev-login", () => {
  it("SHOULD return 404 WHEN NODE_ENV is production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const res = await GET(new NextRequest("http://localhost:3001/auth/dev-login?email=a@b.com"));

    expect(res.status).toBe(404);
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("SHOULD return 404 WHEN SUPABASE_SERVICE_ROLE_KEY is not set", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const res = await GET(new NextRequest("http://localhost:3001/auth/dev-login?email=a@b.com"));

    expect(res.status).toBe(404);
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("SHOULD return 400 WHEN the email param is missing", async () => {
    const res = await GET(new NextRequest("http://localhost:3001/auth/dev-login"));

    expect(res.status).toBe(400);
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("SHOULD return 400 WHEN generateLink fails", async () => {
    generateLink.mockResolvedValue({ data: null, error: { message: "user not found" } });

    const res = await GET(new NextRequest("http://localhost:3001/auth/dev-login?email=a@b.com"));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("user not found");
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("SHOULD return 400 WHEN verifyOtp fails", async () => {
    generateLink.mockResolvedValue({
      data: { properties: { hashed_token: "hashed-token" } },
      error: null,
    });
    verifyOtp.mockResolvedValue({ error: { message: "invalid token" } });

    const res = await GET(new NextRequest("http://localhost:3001/auth/dev-login?email=a@b.com"));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid token");
  });

  it("SHOULD verify the token and redirect to the dashboard WHEN sign-in succeeds", async () => {
    generateLink.mockResolvedValue({
      data: { properties: { hashed_token: "hashed-token" } },
      error: null,
    });
    verifyOtp.mockResolvedValue({ error: null });

    const res = await GET(
      new NextRequest("http://localhost:3001/auth/dev-login?email=dev@example.com"),
    );

    expect(generateLink).toHaveBeenCalledWith({ type: "magiclink", email: "dev@example.com" });
    expect(verifyOtp).toHaveBeenCalledWith({ type: "magiclink", token_hash: "hashed-token" });
    expect(res.headers.get("location")).toBe("http://localhost:3001/app/dashboard");
  });
});

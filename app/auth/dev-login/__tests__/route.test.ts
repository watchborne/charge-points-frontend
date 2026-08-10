import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClient: createAdminSupabaseClient, generateLink } = vi.hoisted(() => {
  const generateLink = vi.fn();
  return {
    generateLink,
    createClient: vi.fn(() => ({ auth: { admin: { generateLink } } })),
  };
});

vi.mock("@supabase/supabase-js", () => ({ createClient: createAdminSupabaseClient }));

import { GET } from "../route";

beforeEach(() => {
  generateLink.mockReset();
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("ENABLE_DEV_LOGIN", "true");
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

  it("SHOULD return 404 WHEN ENABLE_DEV_LOGIN is not set to true", async () => {
    vi.stubEnv("ENABLE_DEV_LOGIN", "");

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
  });

  it("SHOULD return 400 WHEN generateLink succeeds but carries no email_otp", async () => {
    generateLink.mockResolvedValue({ data: { properties: {} }, error: null });

    const res = await GET(new NextRequest("http://localhost:3001/auth/dev-login?email=a@b.com"));

    expect(res.status).toBe(400);
  });

  it("SHOULD return the OTP code WHEN generateLink succeeds", async () => {
    generateLink.mockResolvedValue({
      data: { properties: { email_otp: "654321", hashed_token: "hashed-token" } },
      error: null,
    });

    const res = await GET(
      new NextRequest("http://localhost:3001/auth/dev-login?email=dev@example.com"),
    );

    expect(generateLink).toHaveBeenCalledWith({ type: "magiclink", email: "dev@example.com" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ code: "654321" });
  });
});

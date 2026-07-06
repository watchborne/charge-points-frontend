import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createServerClient } = vi.hoisted(() => ({
  createServerClient: vi.fn(() => ({ auth: { getUser: vi.fn() } })),
}));

vi.mock("@supabase/ssr", () => ({ createServerClient }));

beforeEach(() => {
  vi.resetModules();
  createServerClient.mockClear();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("supabase middleware client", () => {
  it("builds a server client with the configured credentials", async () => {
    const { createClient } = await import("../middleware");
    const request = new NextRequest("http://localhost:3001/app/dashboard");

    createClient(request);

    expect(createServerClient).toHaveBeenCalledTimes(1);
    const [url, key] = createServerClient.mock.calls[0];
    expect(url).toBe("https://test.supabase.co");
    expect(key).toBe("test-anon-key");
  });

  it("returns the supabase client and a response carrying refreshed cookies", async () => {
    const { createClient } = await import("../middleware");
    const request = new NextRequest("http://localhost:3001/app/dashboard");

    const { supabase, supabaseResponse } = createClient(request);

    expect(supabase).toBeDefined();
    expect(supabaseResponse).toBeDefined();
    expect(supabaseResponse.cookies).toBeDefined();
  });

  it("reads cookies from the incoming request via the cookies adapter", async () => {
    const { createClient } = await import("../middleware");
    const request = new NextRequest("http://localhost:3001/app");
    request.cookies.set("sb-access-token", "abc");

    createClient(request);

    const options = createServerClient.mock.calls[0][2] as {
      cookies: { getAll: () => { name: string; value: string }[] };
    };
    const all = options.cookies.getAll();

    expect(all).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "sb-access-token", value: "abc" })]),
    );
  });
});

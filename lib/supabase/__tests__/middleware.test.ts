import type { CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type CookiesAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options: CookieOptions }[]) => void;
};

const { createServerClient } = vi.hoisted(() => {
  const fn = vi.fn<
    (
      url: string,
      key: string,
      options: { cookies: unknown },
    ) => {
      auth: { getUser: ReturnType<typeof vi.fn> };
    }
  >();
  fn.mockImplementation(() => ({ auth: { getUser: vi.fn() } }));
  return { createServerClient: fn };
});

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

  it("returns the client built by createServerClient and a non-redirecting NextResponse", async () => {
    const { createClient } = await import("../middleware");
    const request = new NextRequest("http://localhost:3001/app/dashboard");

    const { supabase, supabaseResponse } = createClient(request);

    expect(supabase).toBe(createServerClient.mock.results[0].value);
    expect(supabaseResponse).toBeInstanceOf(NextResponse);
    expect(supabaseResponse.headers.get("location")).toBeNull();
  });

  it("writes cookies set via the adapter's setAll onto both the response and the request", async () => {
    createServerClient.mockImplementationOnce((_url, _key, options) => {
      (options as { cookies: CookiesAdapter }).cookies.setAll([
        { name: "sb-access-token", value: "refreshed", options: {} },
      ]);
      return { auth: { getUser: vi.fn() } };
    });

    const { createClient } = await import("../middleware");
    const request = new NextRequest("http://localhost:3001/app/dashboard");

    const { supabaseResponse } = createClient(request);

    expect(supabaseResponse.cookies.get("sb-access-token")?.value).toBe("refreshed");
    expect(request.cookies.get("sb-access-token")?.value).toBe("refreshed");
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

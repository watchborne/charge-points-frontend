import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClient } = vi.hoisted(() => ({
  createBrowserClient: vi.fn(() => ({ mock: "browser-client" })),
}));

vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

beforeEach(() => {
  vi.resetModules();
  createBrowserClient.mockClear();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("supabase browser client", () => {
  it("constructs a browser client with the configured URL and anon key", async () => {
    const { createClient } = await import("../client");

    const client = createClient();

    expect(createBrowserClient).toHaveBeenCalledWith("https://test.supabase.co", "test-anon-key");
    expect(client).toEqual({ mock: "browser-client" });
  });
});

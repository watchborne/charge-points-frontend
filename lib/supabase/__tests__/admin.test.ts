import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(() => ({ mock: "admin-client" })),
}));

vi.mock("@supabase/supabase-js", () => ({ createClient }));

beforeEach(() => {
  vi.resetModules();
  createClient.mockClear();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("supabase admin client", () => {
  it("SHOULD throw WHEN SUPABASE_SERVICE_ROLE_KEY is not set", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const { createAdminClient } = await import("../admin");

    expect(() => createAdminClient()).toThrow("SUPABASE_SERVICE_ROLE_KEY is not set");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("SHOULD construct a service-role client WHEN SUPABASE_SERVICE_ROLE_KEY is set", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    const { createAdminClient } = await import("../admin");

    const client = createAdminClient();

    expect(createClient).toHaveBeenCalledWith("https://test.supabase.co", "test-service-role-key");
    expect(client).toEqual({ mock: "admin-client" });
  });
});

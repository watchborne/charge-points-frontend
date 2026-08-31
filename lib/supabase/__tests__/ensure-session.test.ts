import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the external @supabase/ssr (a bare specifier — reliably intercepted,
// unlike an aliased path to one of our own modules). The real
// lib/supabase/client and ensure-session run against it, so the deduplication
// and the failure handling are exercised for real; `getSession` is controlled
// per test.
const { createBrowserClient, getSession } = vi.hoisted(() => {
  const getSession = vi.fn();
  return {
    getSession,
    createBrowserClient: vi.fn(() => ({ auth: { getSession } })),
  };
});

vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

/** A getSession() that stays pending until the returned `release` is called. */
function deferredSession() {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = () => resolve();
  });
  getSession.mockReturnValue(pending.then(() => ({ data: { session: null } })));
  return release;
}

beforeEach(() => {
  // The module holds the in-flight refresh in module scope — each test needs
  // its own instance, or the deduplication state leaks between them.
  vi.resetModules();
  createBrowserClient.mockClear();
  createBrowserClient.mockImplementation(() => ({ auth: { getSession } }));
  getSession.mockReset();
  getSession.mockResolvedValue({ data: { session: null } });
});

describe("ensureFreshSession", () => {
  it("SHOULD refresh the session once WHEN several callers ask concurrently", async () => {
    const release = deferredSession();
    const { ensureFreshSession } = await import("../ensure-session");

    const all = Promise.all([ensureFreshSession(), ensureFreshSession(), ensureFreshSession()]);
    release();
    await all;

    // The whole point: three parallel API calls must not become three
    // concurrent refreshes of the same rotating refresh token (issue #349).
    expect(getSession).toHaveBeenCalledTimes(1);
  });

  it("SHOULD refresh again WHEN a later burst asks after the first settled", async () => {
    const { ensureFreshSession } = await import("../ensure-session");

    await ensureFreshSession();
    await ensureFreshSession();

    // Deduplication is per burst, not a cache: the token found by a later
    // burst may have expired since.
    expect(getSession).toHaveBeenCalledTimes(2);
  });

  it("SHOULD resolve WHEN getSession() rejects", async () => {
    getSession.mockRejectedValue(new Error("network down"));
    const { ensureFreshSession } = await import("../ensure-session");

    // A failed refresh must not fail the API call it precedes — the request
    // goes out and the backend answers 401 if the session is unusable.
    await expect(ensureFreshSession()).resolves.toBeUndefined();
  });

  it("SHOULD resolve WHEN constructing the client throws", async () => {
    createBrowserClient.mockImplementationOnce(() => {
      throw new Error("supabaseUrl is required");
    });
    const { ensureFreshSession } = await import("../ensure-session");

    // createBrowserClient() throws synchronously when the Supabase env vars
    // are unset; the client is constructed inside the promise chain so that
    // surfaces as a swallowed refresh failure, not a rejected API call.
    await expect(ensureFreshSession()).resolves.toBeUndefined();
  });

  it("SHOULD retry the next call WHEN the previous one failed", async () => {
    getSession.mockRejectedValueOnce(new Error("network down"));
    const { ensureFreshSession } = await import("../ensure-session");

    await ensureFreshSession();
    await ensureFreshSession();

    // A failure must clear the in-flight slot too, or one network blip would
    // pin the session unrefreshed for the rest of the page's life.
    expect(getSession).toHaveBeenCalledTimes(2);
  });
});

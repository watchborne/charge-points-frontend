import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// API_URL is read from NEXT_PUBLIC_API_URL at import time in lib/constants, so we
// stub the env and re-import proxy-request (via resetModules) in each test to make
// the backend base URL deterministic. API_SECRET_KEY is read at call time, so it
// can be overridden per test without re-importing.
const BACKEND_URL = "https://backend.test";

const { getSession, createServerClient } = vi.hoisted(() => {
  const getSession = vi.fn().mockResolvedValue({ data: { session: null } });
  return { getSession, createServerClient: vi.fn(() => ({ auth: { getSession } })) };
});

// Both mocked specifiers are external/bare (@supabase/ssr, next/headers), not path
// aliases — those are reliably intercepted, unlike "@/..." aliased mocks (see
// app/auth/callback/__tests__/route.test.ts for the same pattern).
vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("next/headers", () => ({
  cookies: () => ({ getAll: () => [], set: vi.fn() }),
}));

const mockFetch = vi.fn();

function backendResponse(body: string, status = 200) {
  return Promise.resolve(new Response(body, { status }));
}

async function importProxy() {
  const { proxyToBackend } = await import("../proxy-request");
  return proxyToBackend;
}

function requestOf(path: string, init?: RequestInit) {
  return new NextRequest(`http://localhost:3001${path}`, init);
}

type FetchInit = { method: string; headers: Record<string, string>; body?: string };

function fetchCall() {
  const [url, init] = mockFetch.mock.calls[0] as [string, FetchInit];
  return { url, init };
}

beforeEach(() => {
  vi.resetModules();
  mockFetch.mockReset().mockReturnValue(backendResponse("{}"));
  vi.stubGlobal("fetch", mockFetch);
  vi.stubEnv("NEXT_PUBLIC_API_URL", BACKEND_URL);
  vi.stubEnv("API_SECRET_KEY", "secret-key");
  getSession.mockReset().mockResolvedValue({ data: { session: null } });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("proxyToBackend", () => {
  it("SHOULD fetch the backend URL built from API_URL and the backend path", async () => {
    const proxyToBackend = await importProxy();

    await proxyToBackend(requestOf("/api/charge-points"), "/api/charge-points");

    expect(fetchCall().url).toBe(`${BACKEND_URL}/api/charge-points`);
  });

  it("SHOULD forward the incoming query params to the backend URL", async () => {
    const proxyToBackend = await importProxy();

    await proxyToBackend(
      requestOf("/api/charge-points?status=active&siteId=site-1"),
      "/api/charge-points",
    );

    const params = new URL(fetchCall().url).searchParams;
    expect(params.get("status")).toBe("active");
    expect(params.get("siteId")).toBe("site-1");
  });

  it("SHOULD inject the x-api-key header from API_SECRET_KEY", async () => {
    const proxyToBackend = await importProxy();

    await proxyToBackend(requestOf("/api/charge-points"), "/api/charge-points");

    expect(fetchCall().init.headers).toMatchObject({
      "Content-Type": "application/json",
      "x-api-key": "secret-key",
    });
  });

  it("SHOULD forward the caller's Supabase access token as an Authorization header", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "the-jwt" } } });
    const proxyToBackend = await importProxy();

    await proxyToBackend(requestOf("/api/charge-points"), "/api/charge-points");

    expect(fetchCall().init.headers["Authorization"]).toBe("Bearer the-jwt");
  });

  it("SHOULD omit the Authorization header WHEN there is no session", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    const proxyToBackend = await importProxy();

    await proxyToBackend(requestOf("/api/charge-points"), "/api/charge-points");

    expect(fetchCall().init.headers["Authorization"]).toBeUndefined();
  });

  it("SHOULD omit the x-api-key header WHEN API_SECRET_KEY is not configured", async () => {
    vi.stubEnv("API_SECRET_KEY", undefined);
    const proxyToBackend = await importProxy();

    await proxyToBackend(requestOf("/api/charge-points"), "/api/charge-points");

    expect(fetchCall().init.headers["x-api-key"]).toBeUndefined();
    expect(fetchCall().init.headers["Content-Type"]).toBe("application/json");
  });

  it("SHOULD forward the request body WHEN the method is not GET or HEAD", async () => {
    const proxyToBackend = await importProxy();
    const body = JSON.stringify({ name: "Borne A" });

    await proxyToBackend(
      requestOf("/api/charge-points", { method: "POST", body }),
      "/api/charge-points",
    );

    const call = fetchCall();
    expect(call.init.method).toBe("POST");
    expect(call.init.body).toBe(body);
  });

  it("SHOULD NOT forward a body WHEN the method is GET", async () => {
    const proxyToBackend = await importProxy();

    await proxyToBackend(requestOf("/api/charge-points"), "/api/charge-points");

    const call = fetchCall();
    expect(call.init.method).toBe("GET");
    expect(call.init.body).toBeUndefined();
  });

  it("SHOULD return the backend response body and status", async () => {
    mockFetch.mockReturnValue(backendResponse('{"id":"cp-1"}', 201));
    const proxyToBackend = await importProxy();

    const res = await proxyToBackend(
      requestOf("/api/charge-points", { method: "POST", body: "{}" }),
      "/api/charge-points",
    );

    expect(res.status).toBe(201);
    expect(await res.text()).toBe('{"id":"cp-1"}');
  });

  it("SHOULD propagate a non-2xx backend status", async () => {
    mockFetch.mockReturnValue(backendResponse('{"error":"boom"}', 500));
    const proxyToBackend = await importProxy();

    const res = await proxyToBackend(requestOf("/api/charge-points"), "/api/charge-points");

    expect(res.status).toBe(500);
    expect(await res.text()).toBe('{"error":"boom"}');
  });

  it("SHOULD set Content-Type application/json on the proxied response", async () => {
    const proxyToBackend = await importProxy();

    const res = await proxyToBackend(requestOf("/api/charge-points"), "/api/charge-points");

    expect(res.headers.get("content-type")).toBe("application/json");
  });
});

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
// proxy/__tests__/proxy.test.ts for the same pattern).
vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("next/headers", () => ({
  cookies: () => ({ getAll: () => [], set: vi.fn() }),
}));

const { captureException } = vi.hoisted(() => ({ captureException: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureException }));

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

  it("SHOULD return a 502 WHEN the backend fetch throws a network error", async () => {
    mockFetch.mockRejectedValue(new TypeError("fetch failed"));
    const proxyToBackend = await importProxy();

    const res = await proxyToBackend(requestOf("/api/charge-points"), "/api/charge-points");

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Backend unreachable" });
  });

  it("SHOULD report the error to Sentry WHEN the backend fetch throws a network error", async () => {
    const error = new TypeError("fetch failed");
    mockFetch.mockRejectedValue(error);
    const proxyToBackend = await importProxy();

    await proxyToBackend(requestOf("/api/charge-points"), "/api/charge-points");

    expect(captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ tags: { area: "api-proxy" } }),
    );
  });
});

describe("proxyFileToBackend", () => {
  const importFileProxy = async () => (await import("../proxy-request")).proxyFileToBackend;

  const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0xff, 0x00, 0xfe]);

  function fileResponse(headers: Record<string, string> = {}, status = 200) {
    return Promise.resolve(
      new Response(pdfBytes, {
        status,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="site-report.pdf"',
          ...headers,
        },
      }),
    );
  }

  it("SHOULD forward the request exactly like proxyToBackend: path, query, key and bearer token", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "the-jwt" } } });
    mockFetch.mockReturnValue(fileResponse());
    const proxyFileToBackend = await importFileProxy();

    await proxyFileToBackend(
      requestOf("/api/sites/s1/report?locale=en&from=2026-08-01T00:00:00.000Z"),
      "/api/sites/s1/report.pdf",
    );

    const { url, init } = fetchCall();
    expect(new URL(url).pathname).toBe("/api/sites/s1/report.pdf");
    expect(new URL(url).searchParams.get("locale")).toBe("en");
    expect(new URL(url).searchParams.get("from")).toBe("2026-08-01T00:00:00.000Z");
    expect(init.headers).toMatchObject({
      "x-api-key": "secret-key",
      Authorization: "Bearer the-jwt",
    });
  });

  it("SHOULD return the binary body untouched", async () => {
    mockFetch.mockReturnValue(fileResponse());
    const proxyFileToBackend = await importFileProxy();

    const response = await proxyFileToBackend(requestOf("/api/sites/s1/report"), "/x.pdf");

    expect(new Uint8Array(await response.arrayBuffer())).toEqual(pdfBytes);
  });

  it("SHOULD pass through the content type and the download filename", async () => {
    mockFetch.mockReturnValue(fileResponse());
    const proxyFileToBackend = await importFileProxy();

    const response = await proxyFileToBackend(requestOf("/api/sites/s1/report"), "/x.pdf");

    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="site-report.pdf"',
    );
  });

  it("SHOULD never let the file be cached", async () => {
    mockFetch.mockReturnValue(fileResponse());
    const proxyFileToBackend = await importFileProxy();

    const response = await proxyFileToBackend(requestOf("/api/sites/s1/report"), "/x.pdf");

    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("SHOULD keep the backend's status and JSON content type WHEN it answers with an error", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve(
        new Response(JSON.stringify({ message: "Unknown site 's1'." }), {
          status: 404,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }),
      ),
    );
    const proxyFileToBackend = await importFileProxy();

    const response = await proxyFileToBackend(requestOf("/api/sites/s1/report"), "/x.pdf");

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(response.headers.get("Content-Disposition")).toBeNull();
    expect(await response.json()).toEqual({ message: "Unknown site 's1'." });
  });

  it("SHOULD answer 502 and report to Sentry WHEN the backend is unreachable", async () => {
    mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));
    const proxyFileToBackend = await importFileProxy();

    const response = await proxyFileToBackend(requestOf("/api/sites/s1/report"), "/x.pdf");

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Backend unreachable" });
    expect(captureException).toHaveBeenCalled();
  });
});

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Both mocked specifiers are external/bare (@supabase/ssr, next/headers), not path
// aliases — those are reliably intercepted, unlike "@/..." aliased mocks (see
// lib/__tests__/proxy-request.test.ts for the same pattern this route's test suite
// follows throughout app/api/**).
const { getSession, createServerClient } = vi.hoisted(() => {
  const getSession = vi.fn().mockResolvedValue({ data: { session: null } });
  return { getSession, createServerClient: vi.fn(() => ({ auth: { getSession } })) };
});

vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("next/headers", () => ({
  cookies: () => ({ getAll: () => [], set: vi.fn() }),
}));

import { GET, PUT, DELETE } from "../route";

const mockFetch = vi.fn();

function backendResponse(body = "{}", status = 200) {
  return Promise.resolve(new Response(body, { status }));
}

function requestOf(path: string, init?: RequestInit) {
  return new NextRequest(`http://localhost:3001${path}`, init);
}

function fetchCall() {
  return mockFetch.mock.calls[0] as [string, RequestInit];
}

beforeEach(() => {
  mockFetch.mockReset().mockReturnValue(backendResponse());
  vi.stubGlobal("fetch", mockFetch);
  getSession.mockReset().mockResolvedValue({ data: { session: null } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/sites/[id]/next-visit", () => {
  it("SHOULD proxy to the backend endpoint scoped to the site id", async () => {
    await GET(requestOf("/api/sites/site-1/next-visit"), {
      params: Promise.resolve({ id: "site-1" }),
    });

    const [url, init] = fetchCall();
    expect(url).toBe("http://localhost:3000/api/sites/site-1/next-visit");
    expect(init.method).toBe("GET");
  });
});

describe("PUT /api/sites/[id]/next-visit", () => {
  it("SHOULD proxy the request body to the backend endpoint", async () => {
    await PUT(
      requestOf("/api/sites/site-1/next-visit", {
        method: "PUT",
        body: JSON.stringify({ nextVisitAt: "2026-10-01T00:00:00.000Z" }),
      }),
      { params: Promise.resolve({ id: "site-1" }) },
    );

    const [url, init] = fetchCall();
    expect(url).toBe("http://localhost:3000/api/sites/site-1/next-visit");
    expect(init.method).toBe("PUT");
    expect(init.body).toBe(JSON.stringify({ nextVisitAt: "2026-10-01T00:00:00.000Z" }));
  });
});

describe("DELETE /api/sites/[id]/next-visit", () => {
  it("SHOULD proxy to the backend endpoint scoped to the site id", async () => {
    await DELETE(requestOf("/api/sites/site-1/next-visit", { method: "DELETE" }), {
      params: Promise.resolve({ id: "site-1" }),
    });

    const [url, init] = fetchCall();
    expect(url).toBe("http://localhost:3000/api/sites/site-1/next-visit");
    expect(init.method).toBe("DELETE");
  });
});

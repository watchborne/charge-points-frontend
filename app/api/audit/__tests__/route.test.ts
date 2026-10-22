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

import { GET } from "../route";

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

describe("GET /api/audit", () => {
  it("SHOULD proxy to the backend's platform-wide audit endpoint", async () => {
    await GET(requestOf("/api/audit"));

    const [url, init] = fetchCall();
    expect(url).toBe("http://localhost:3000/api/audit");
    expect(init.method).toBe("GET");
  });

  it("SHOULD forward siteId/customerId filters to the backend", async () => {
    await GET(requestOf("/api/audit?siteId=site-1&customerId=customer-1"));

    const [url] = fetchCall();
    const params = new URL(url).searchParams;
    expect(params.get("siteId")).toBe("site-1");
    expect(params.get("customerId")).toBe("customer-1");
  });
});

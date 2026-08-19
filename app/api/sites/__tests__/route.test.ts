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

import { GET, POST } from "../route";

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

describe("GET /api/sites", () => {
  it("SHOULD proxy the request to the backend /api/sites endpoint", async () => {
    await GET(requestOf("/api/sites"));

    const [url, init] = fetchCall();
    expect(url).toBe("http://localhost:3000/api/sites");
    expect(init.method).toBe("GET");
  });
});

describe("POST /api/sites", () => {
  it("SHOULD proxy the request body to the backend /api/sites endpoint", async () => {
    const body = JSON.stringify({ name: "Site A" });

    await POST(requestOf("/api/sites", { method: "POST", body }));

    const [url, init] = fetchCall();
    expect(url).toBe("http://localhost:3000/api/sites");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(body);
  });
});

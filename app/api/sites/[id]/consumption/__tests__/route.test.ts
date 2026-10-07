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

describe("GET /api/sites/[id]/consumption", () => {
  it("SHOULD proxy to the backend endpoint scoped to the site id", async () => {
    await GET(requestOf("/api/sites/site-1/consumption"), {
      params: Promise.resolve({ id: "site-1" }),
    });

    const [url, init] = fetchCall();
    expect(url).toBe("http://localhost:3000/api/sites/site-1/consumption");
    expect(init.method).toBe("GET");
  });

  it("SHOULD forward from/to and connectorId", async () => {
    await GET(
      requestOf(
        "/api/sites/site-1/consumption?from=2026-08-01T00:00:00.000Z&to=2026-08-02T00:00:00.000Z&connectorId=2",
      ),
      { params: Promise.resolve({ id: "site-1" }) },
    );

    const [url] = fetchCall();
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "http://localhost:3000/api/sites/site-1/consumption",
    );
    expect(parsed.searchParams.get("from")).toBe("2026-08-01T00:00:00.000Z");
    expect(parsed.searchParams.get("to")).toBe("2026-08-02T00:00:00.000Z");
    expect(parsed.searchParams.get("connectorId")).toBe("2");
  });

  it("SHOULD keep every repeated measurand, not just the last", async () => {
    await GET(
      requestOf("/api/sites/site-1/consumption?measurand=Voltage&measurand=Power.Active.Import"),
      { params: Promise.resolve({ id: "site-1" }) },
    );

    const [url] = fetchCall();
    expect(new URL(url).searchParams.getAll("measurand")).toEqual([
      "Voltage",
      "Power.Active.Import",
    ]);
  });
});

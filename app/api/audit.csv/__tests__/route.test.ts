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

function backendResponse(body = "", headers: Record<string, string> = {}, status = 200) {
  return Promise.resolve(new Response(body, { status, headers }));
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

describe("GET /api/audit.csv", () => {
  it("SHOULD proxy to the backend's CSV export endpoint", async () => {
    await GET(requestOf("/api/audit.csv"));

    const [url, init] = fetchCall();
    expect(url).toBe("http://localhost:3000/api/audit.csv");
    expect(init.method).toBe("GET");
  });

  it("SHOULD pass the backend's Content-Type/Content-Disposition through, not force JSON", async () => {
    mockFetch.mockReturnValue(
      backendResponse("id,action\n1,CHARGE_POINT_RESET\n", {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="audit.csv"',
      }),
    );

    const res = await GET(requestOf("/api/audit.csv"));

    expect(res.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="audit.csv"');
  });
});

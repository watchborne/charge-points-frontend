import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, createServerClient } = vi.hoisted(() => {
  const getSession = vi.fn().mockResolvedValue({ data: { session: null } });
  return { getSession, createServerClient: vi.fn(() => ({ auth: { getSession } })) };
});

vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("next/headers", () => ({
  cookies: () => ({ getAll: () => [], set: vi.fn() }),
}));

import { DELETE, GET, PATCH } from "../route";

const mockFetch = vi.fn();

const requestOf = (init?: RequestInit) =>
  new NextRequest("http://localhost:3001/api/sites/site-1/alert-thresholds", init);

const paramsOf = (id: string) => ({ params: Promise.resolve({ id }) });

const fetchCall = () => mockFetch.mock.calls[0] as [string, RequestInit];

beforeEach(() => {
  mockFetch.mockReset().mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", mockFetch);
  getSession.mockReset().mockResolvedValue({ data: { session: null } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/api/sites/[id]/alert-thresholds", () => {
  it("SHOULD proxy GET to the backend path for the site", async () => {
    await GET(requestOf(), paramsOf("site-1"));

    const [url, init] = fetchCall();
    expect(url).toMatch(/\/api\/sites\/site-1\/alert-thresholds$/);
    expect(init.method).toBe("GET");
  });

  it("SHOULD proxy PATCH with its body", async () => {
    await PATCH(
      requestOf({
        method: "PATCH",
        body: JSON.stringify({ offlineAfterMs: 7_200_000 }),
        headers: { "content-type": "application/json" },
      }),
      paramsOf("site-1"),
    );

    const [url, init] = fetchCall();
    expect(url).toMatch(/\/api\/sites\/site-1\/alert-thresholds$/);
    expect(init.method).toBe("PATCH");
    expect(init.body).toBeDefined();
  });

  it("SHOULD proxy DELETE and pass a 204 through", async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 204 }));

    const response = await DELETE(requestOf({ method: "DELETE" }), paramsOf("site-1"));

    expect(fetchCall()[1].method).toBe("DELETE");
    expect(response.status).toBe(204);
  });

  it("SHOULD forward the caller's access token WHEN a session exists", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "token-1" } } });

    await GET(requestOf(), paramsOf("site-1"));

    expect(new Headers(fetchCall()[1].headers).get("authorization")).toBe("Bearer token-1");
  });
});

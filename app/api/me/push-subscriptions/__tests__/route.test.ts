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

import { DELETE, POST } from "../route";

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

const BACKEND_PATH = "http://localhost:3000/api/me/push-subscriptions";

describe("POST /api/me/push-subscriptions", () => {
  it("SHOULD proxy the request to the backend push-subscriptions endpoint", async () => {
    const body = JSON.stringify({
      endpoint: "https://push.example/abc",
      keys: { p256dh: "p256dh-value", auth: "auth-value" },
    });

    await POST(requestOf("/api/me/push-subscriptions", { method: "POST", body }));

    const [url, init] = fetchCall();
    expect(url).toBe(BACKEND_PATH);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(body);
  });
});

describe("DELETE /api/me/push-subscriptions", () => {
  it("SHOULD proxy the request, forwarding the endpoint in the body", async () => {
    const body = JSON.stringify({ endpoint: "https://push.example/abc" });

    await DELETE(requestOf("/api/me/push-subscriptions", { method: "DELETE", body }));

    const [url, init] = fetchCall();
    expect(url).toBe(BACKEND_PATH);
    expect(init.method).toBe("DELETE");
    expect(init.body).toBe(body);
  });
});

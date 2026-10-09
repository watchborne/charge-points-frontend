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

function pdfResponse() {
  return Promise.resolve(
    new Response("%PDF-1.7", {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="site-report.pdf"',
      },
    }),
  );
}

function requestOf(path: string, init?: RequestInit) {
  return new NextRequest(`http://localhost:3001${path}`, init);
}

function fetchCall() {
  return mockFetch.mock.calls[0] as [string, RequestInit];
}

beforeEach(() => {
  mockFetch.mockReset().mockReturnValue(pdfResponse());
  vi.stubGlobal("fetch", mockFetch);
  getSession.mockReset().mockResolvedValue({ data: { session: null } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/sites/[id]/report", () => {
  it("SHOULD proxy to the backend's report.pdf endpoint scoped to the site id", async () => {
    await GET(requestOf("/api/sites/site-1/report"), {
      params: Promise.resolve({ id: "site-1" }),
    });

    const [url, init] = fetchCall();
    expect(new URL(url).pathname).toBe("/api/sites/site-1/report.pdf");
    expect(init.method).toBe("GET");
  });

  it("SHOULD forward the locale and window query params", async () => {
    await GET(requestOf("/api/sites/site-1/report?locale=en&from=2026-08-01T00:00:00.000Z"), {
      params: Promise.resolve({ id: "site-1" }),
    });

    const params = new URL(fetchCall()[0]).searchParams;
    expect(params.get("locale")).toBe("en");
    expect(params.get("from")).toBe("2026-08-01T00:00:00.000Z");
  });

  it("SHOULD forward the caller's bearer token", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "the-jwt" } } });

    await GET(requestOf("/api/sites/site-1/report"), {
      params: Promise.resolve({ id: "site-1" }),
    });

    expect((fetchCall()[1].headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer the-jwt",
    );
  });

  it("SHOULD answer with the PDF and its download headers", async () => {
    const response = await GET(requestOf("/api/sites/site-1/report"), {
      params: Promise.resolve({ id: "site-1" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="site-report.pdf"',
    );
    expect(await response.text()).toBe("%PDF-1.7");
  });
});

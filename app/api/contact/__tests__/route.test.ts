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

import { contactRateLimiter } from "../../../../lib/contact-rate-limit";
import { POST } from "../route";

const mockFetch = vi.fn();

const validBody = {
  company: "Acme",
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "0102030405",
  chargePoints: "12",
  message: "Hello there",
  locale: "en",
};

const requestOf = (body: unknown, ip = "203.0.113.1") =>
  new NextRequest("http://localhost:3001/api/contact", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("POST /api/contact", () => {
  beforeEach(() => {
    contactRateLimiter.reset();
    vi.stubGlobal("fetch", mockFetch);
    getSession.mockReset().mockResolvedValue({ data: { session: null } });
    // A fresh Response per call: a body can only be read once.
    mockFetch
      .mockReset()
      .mockImplementation(async () => new Response('{"ok":true}', { status: 200 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("SHOULD relay the submitted message to the backend /api/contact WHEN under the limit", async () => {
    const response = await POST(requestOf(validBody));

    expect(response.status).toBe(200);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/contact");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(validBody);
  });

  it("SHOULD hand the backend's refusal back to the visitor WHEN the backend rejects the message", async () => {
    mockFetch.mockResolvedValue(new Response('{"message":"bad"}', { status: 400 }));

    const response = await POST(requestOf({ ...validBody, email: "nope" }));

    expect(response.status).toBe(400);
  });

  it("SHOULD answer 502 WHEN the backend is unreachable", async () => {
    mockFetch.mockRejectedValue(new Error("connection refused"));

    const response = await POST(requestOf(validBody));

    expect(response.status).toBe(502);
  });

  it("SHOULD answer 429 with Retry-After AND NOT reach the backend WHEN a client exceeds the limit", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await POST(requestOf(validBody))).status).toBe(200);
    }
    mockFetch.mockClear();

    const response = await POST(requestOf(validBody));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ code: "RATE_LIMITED" });
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("SHOULD keep serving another client WHEN one client is rate limited", async () => {
    for (let i = 0; i < 6; i++) await POST(requestOf(validBody));

    const response = await POST(requestOf(validBody, "198.51.100.7"));

    expect(response.status).toBe(200);
  });
});

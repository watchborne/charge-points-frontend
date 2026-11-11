import * as Sentry from "@sentry/nextjs";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    vi.mocked(Sentry.captureException).mockClear();
    vi.stubGlobal("fetch", mockFetch);
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockResolvedValue(new Response("{}", { status: 200 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    mockFetch.mockReset();
  });

  it("SHOULD email the submitted content to the default recipient WHEN the input is valid", async () => {
    const response = await POST(requestOf(validBody));

    expect(response.status).toBe(200);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    const sent = JSON.parse(init.body);
    expect(sent.to).toEqual(["adrien.miquel.pro@gmail.com"]);
    expect(sent.reply_to).toBe("jane@example.com");
    expect(sent.text).toContain("Hello there");
    expect(sent.text).toContain("Acme");
  });

  it("SHOULD acknowledge the sender in French WHEN no locale is given", async () => {
    await POST(requestOf(validBody));

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const ack = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(ack.to).toEqual(["jane@example.com"]);
    expect(ack.subject).toBe("Nous avons bien reçu votre message");
    expect(ack.text).toContain("Bonjour Jane Doe,");
    expect(ack).not.toHaveProperty("reply_to");
  });

  it("SHOULD acknowledge in the sender's language AND NOT echo their message WHEN locale is en", async () => {
    vi.stubEnv("CONTACT_EMAIL_REPLY_TO", "contact@example.com");

    await POST(requestOf({ ...validBody, locale: "en" }));

    const ack = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(ack.subject).toBe("We have received your message");
    expect(ack.text).toContain("Hello Jane Doe,");
    expect(ack.text).not.toContain("Hello there");
    expect(ack.reply_to).toBe("contact@example.com");
  });

  it("SHOULD answer 200 AND report the failure WHEN only the acknowledgement is rejected", async () => {
    mockFetch
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 422 }));

    const response = await POST(requestOf(validBody));

    expect(response.status).toBe(200);
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { context: "contact.acknowledge" },
    });
  });

  it("SHOULD answer 200 WHEN sending the acknowledgement throws", async () => {
    mockFetch
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockRejectedValueOnce(new Error("network"));

    const response = await POST(requestOf(validBody));

    expect(response.status).toBe(200);
  });

  it("SHOULD answer 400 WHEN the locale is unsupported", async () => {
    const response = await POST(requestOf({ ...validBody, locale: "de" }));

    expect(response.status).toBe(400);
  });

  it("SHOULD answer 400 and send nothing WHEN the email is invalid", async () => {
    const response = await POST(requestOf({ ...validBody, email: "nope" }));

    expect(response.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("SHOULD answer 400 WHEN the body is not JSON", async () => {
    const response = await POST(requestOf("not json"));

    expect(response.status).toBe(400);
  });

  it("SHOULD answer 500 WHEN RESEND_API_KEY is not set", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    const response = await POST(requestOf(validBody));

    expect(response.status).toBe(500);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { context: "contact.config" },
    });
  });

  it("SHOULD answer 502 WHEN the email provider rejects the request", async () => {
    mockFetch.mockResolvedValue(new Response("{}", { status: 422 }));

    const response = await POST(requestOf(validBody));

    expect(response.status).toBe(502);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { context: "contact.send" },
    });
  });

  it("SHOULD answer 429 with Retry-After AND NOT email WHEN a client exceeds the limit", async () => {
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

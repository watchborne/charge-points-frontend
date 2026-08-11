import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { accessRequestApis } from "../api-access-requests";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const jsonResponse = (body: unknown, status: number) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

describe("accessRequestApis.checkLoginAccess", () => {
  it("SHOULD report allowed: true WHEN the backend returns 200", async () => {
    mockFetch.mockReturnValue(jsonResponse({ ok: true }, 200));

    const result = await accessRequestApis.checkLoginAccess("user@example.com");

    expect(result).toEqual({ allowed: true });
  });

  it("SHOULD report allowed: false with the code WHEN the backend returns 202 (pending)", async () => {
    mockFetch.mockReturnValue(jsonResponse({ message: "pending", code: "ACCESS_PENDING" }, 202));

    const result = await accessRequestApis.checkLoginAccess("user@example.com");

    expect(result).toEqual({ allowed: false, code: "ACCESS_PENDING" });
  });

  it("SHOULD report allowed: false with NOT_INVITED WHEN the backend returns 403", async () => {
    mockFetch.mockReturnValue(jsonResponse({ message: "denied", code: "NOT_INVITED" }, 403));

    const result = await accessRequestApis.checkLoginAccess("user@example.com");

    expect(result).toEqual({ allowed: false, code: "NOT_INVITED" });
  });

  it("SHOULD rethrow WHEN the backend fails for an unrelated reason", async () => {
    mockFetch.mockReturnValue(jsonResponse(null, 500));

    await expect(accessRequestApis.checkLoginAccess("user@example.com")).rejects.toThrow(
      "HTTP error! status: 500",
    );
  });
});

describe("accessRequestApis.verifyEmail", () => {
  it("SHOULD report verified: true WHEN the backend returns 200", async () => {
    mockFetch.mockReturnValue(jsonResponse({ ok: true }, 200));

    const result = await accessRequestApis.verifyEmail("some-token");

    expect(result).toEqual({ verified: true });
  });

  it("SHOULD report verified: false with EXPIRED_TOKEN WHEN the backend returns 400", async () => {
    mockFetch.mockReturnValue(jsonResponse({ message: "expired", code: "EXPIRED_TOKEN" }, 400));

    const result = await accessRequestApis.verifyEmail("some-token");

    expect(result).toEqual({ verified: false, code: "EXPIRED_TOKEN" });
  });

  it("SHOULD report verified: false with INVALID_TOKEN WHEN the backend returns 400", async () => {
    mockFetch.mockReturnValue(jsonResponse({ message: "invalid", code: "INVALID_TOKEN" }, 400));

    const result = await accessRequestApis.verifyEmail("some-token");

    expect(result).toEqual({ verified: false, code: "INVALID_TOKEN" });
  });

  it("SHOULD rethrow WHEN the backend fails for an unrelated reason", async () => {
    mockFetch.mockReturnValue(jsonResponse(null, 500));

    await expect(accessRequestApis.verifyEmail("some-token")).rejects.toThrow(
      "HTTP error! status: 500",
    );
  });
});

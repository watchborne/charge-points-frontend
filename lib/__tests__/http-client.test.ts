import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "../http-client";

// Every request refreshes the browser session first (issue #349). Mocked at
// the external @supabase/ssr boundary (a bare specifier — reliably
// intercepted), so the real ensureFreshSession runs and `getSession` stands in
// for the refresh here; its deduplication is covered on its own in
// lib/supabase/__tests__/ensure-session.test.ts.
const { createBrowserClient, getSession } = vi.hoisted(() => {
  const getSession = vi.fn();
  return {
    getSession,
    createBrowserClient: vi.fn(() => ({ auth: { getSession } })),
  };
});

vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  // Re-established every time: the afterEach below calls restoreAllMocks,
  // which can strip the implementation and leave the factory returning
  // undefined — the client would then throw on `.auth` and the refresh would
  // be silently swallowed instead of observed.
  createBrowserClient.mockImplementation(() => ({ auth: { getSession } }));
  getSession.mockReset();
  getSession.mockResolvedValue({ data: { session: null } });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function okResponse(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
}

function errorResponse(status: number) {
  return Promise.resolve(new Response(null, { status }));
}

describe("session refresh", () => {
  it("SHOULD refresh the session BEFORE issuing the request", async () => {
    const order: string[] = [];
    getSession.mockImplementation(async () => {
      order.push("refresh");
      return { data: { session: null } };
    });
    mockFetch.mockImplementation(() => {
      order.push("fetch");
      return okResponse({});
    });

    await httpClient.get("/api/items");

    // Ordering is the whole point: the request authenticates with the cookie
    // the browser holds when it goes out, so a refresh after the fetch would
    // be worthless.
    expect(order).toEqual(["refresh", "fetch"]);
  });

  it("SHOULD refresh the session on every verb", async () => {
    // mockImplementation, not mockReturnValue: each call needs its own
    // Response — a single one has its body read by the first request and
    // throws "Body is unusable" on the second.
    mockFetch.mockImplementation(() => okResponse({}));

    await httpClient.get("/api/items");
    await httpClient.post("/api/items", {});
    await httpClient.patch("/api/items/1", {});
    await httpClient.delete("/api/items/1");

    expect(getSession).toHaveBeenCalledTimes(4);
  });
});

describe("httpClient.get", () => {
  it("SHOULD call fetch with GET and JSON headers", async () => {
    mockFetch.mockReturnValue(okResponse({ id: 1 }));

    await httpClient.get("/api/items");

    expect(mockFetch).toHaveBeenCalledWith("/api/items", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
  });

  it("SHOULD return parsed JSON", async () => {
    mockFetch.mockReturnValue(okResponse({ id: 1, name: "test" }));

    const result = await httpClient.get<{ id: number; name: string }>("/api/items/1");

    expect(result).toEqual({ id: 1, name: "test" });
  });

  it("SHOULD throw WHEN the response is not ok", async () => {
    mockFetch.mockReturnValue(errorResponse(404));

    await expect(httpClient.get("/api/missing")).rejects.toThrow("HTTP error! status: 404");
  });
});

describe("httpClient.post", () => {
  it("SHOULD call fetch with POST, JSON headers, and a serialized body", async () => {
    mockFetch.mockReturnValue(okResponse({ id: 2 }));
    const payload = { name: "new item" };

    await httpClient.post("/api/items", payload);

    expect(mockFetch).toHaveBeenCalledWith("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });

  it("SHOULD return parsed JSON", async () => {
    const created = { id: 2, name: "new item" };
    mockFetch.mockReturnValue(okResponse(created));

    const result = await httpClient.post<typeof created>("/api/items", { name: "new item" });

    expect(result).toEqual(created);
  });

  it("SHOULD throw WHEN the response is not ok", async () => {
    mockFetch.mockReturnValue(errorResponse(422));

    await expect(httpClient.post("/api/items", {})).rejects.toThrow("HTTP error! status: 422");
  });
});

describe("httpClient.patch", () => {
  it("SHOULD call fetch with PATCH, JSON headers, and a serialized body", async () => {
    mockFetch.mockReturnValue(okResponse({ id: 1, name: "updated" }));
    const payload = { name: "updated" };

    await httpClient.patch("/api/items/1", payload);

    expect(mockFetch).toHaveBeenCalledWith("/api/items/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });

  it("SHOULD return parsed JSON", async () => {
    const updated = { id: 1, name: "updated" };
    mockFetch.mockReturnValue(okResponse(updated));

    const result = await httpClient.patch<typeof updated>("/api/items/1", { name: "updated" });

    expect(result).toEqual(updated);
  });

  it("SHOULD throw WHEN the response is not ok", async () => {
    mockFetch.mockReturnValue(errorResponse(500));

    await expect(httpClient.patch("/api/items/1", {})).rejects.toThrow("HTTP error! status: 500");
  });
});

describe("httpClient.delete", () => {
  it("SHOULD call fetch with DELETE method and JSON headers", async () => {
    mockFetch.mockReturnValue(okResponse(null));

    await httpClient.delete("/api/items/1");

    expect(mockFetch).toHaveBeenCalledWith("/api/items/1", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
  });

  it("SHOULD resolve WHEN the response is a real 204 with no body, not throw on JSON parsing", async () => {
    // What every DELETE this proxies actually returns (z.void() on the
    // backend) — unlike okResponse(null) above, this has no body at all.
    mockFetch.mockReturnValue(Promise.resolve(new Response(null, { status: 204 })));

    await expect(httpClient.delete("/api/items/1")).resolves.toBeUndefined();
  });

  it("SHOULD throw WHEN the response is not ok", async () => {
    mockFetch.mockReturnValue(errorResponse(403));

    await expect(httpClient.delete("/api/items/1")).rejects.toThrow("HTTP error! status: 403");
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { httpClient } from "../http-client";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
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

describe("httpClient.get", () => {
  it("calls fetch with GET and JSON headers", async () => {
    mockFetch.mockReturnValue(okResponse({ id: 1 }));

    await httpClient.get("/api/items");

    expect(mockFetch).toHaveBeenCalledWith("/api/items", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
  });

  it("returns parsed JSON", async () => {
    mockFetch.mockReturnValue(okResponse({ id: 1, name: "test" }));

    const result = await httpClient.get<{ id: number; name: string }>("/api/items/1");

    expect(result).toEqual({ id: 1, name: "test" });
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockReturnValue(errorResponse(404));

    await expect(httpClient.get("/api/missing")).rejects.toThrow("HTTP error! status: 404");
  });
});

describe("httpClient.post", () => {
  it("calls fetch with POST, JSON headers, and serialized body", async () => {
    mockFetch.mockReturnValue(okResponse({ id: 2 }));
    const payload = { name: "new item" };

    await httpClient.post("/api/items", payload);

    expect(mockFetch).toHaveBeenCalledWith("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });

  it("returns parsed JSON", async () => {
    const created = { id: 2, name: "new item" };
    mockFetch.mockReturnValue(okResponse(created));

    const result = await httpClient.post<typeof created>("/api/items", { name: "new item" });

    expect(result).toEqual(created);
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockReturnValue(errorResponse(422));

    await expect(httpClient.post("/api/items", {})).rejects.toThrow("HTTP error! status: 422");
  });
});

describe("httpClient.patch", () => {
  it("calls fetch with PATCH, JSON headers, and serialized body", async () => {
    mockFetch.mockReturnValue(okResponse({ id: 1, name: "updated" }));
    const payload = { name: "updated" };

    await httpClient.patch("/api/items/1", payload);

    expect(mockFetch).toHaveBeenCalledWith("/api/items/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });

  it("returns parsed JSON", async () => {
    const updated = { id: 1, name: "updated" };
    mockFetch.mockReturnValue(okResponse(updated));

    const result = await httpClient.patch<typeof updated>("/api/items/1", { name: "updated" });

    expect(result).toEqual(updated);
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockReturnValue(errorResponse(500));

    await expect(httpClient.patch("/api/items/1", {})).rejects.toThrow("HTTP error! status: 500");
  });
});

describe("httpClient.delete", () => {
  it("calls fetch with DELETE method and JSON headers", async () => {
    mockFetch.mockReturnValue(okResponse(null));

    await httpClient.delete("/api/items/1");

    expect(mockFetch).toHaveBeenCalledWith("/api/items/1", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockReturnValue(errorResponse(403));

    await expect(httpClient.delete("/api/items/1")).rejects.toThrow("HTTP error! status: 403");
  });
});

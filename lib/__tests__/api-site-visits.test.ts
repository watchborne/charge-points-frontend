import { afterEach, describe, expect, it, vi } from "vitest";

import { siteVisitApis } from "../api-site-visits";
import { httpClient } from "../http-client";

vi.mock("../http-client", () => ({
  httpClient: { get: vi.fn().mockResolvedValue([]), post: vi.fn() },
}));

const lastGetUrl = () => vi.mocked(httpClient.get).mock.calls.at(-1)?.[0] as string;

afterEach(() => vi.clearAllMocks());

describe("siteVisitApis.list", () => {
  it("SHOULD hit the local proxy path for the site", async () => {
    await siteVisitApis.list("site-1");

    expect(lastGetUrl()).toBe("/api/sites/site-1/visits");
  });

  it("SHOULD send no query string WHEN no filter is given", async () => {
    await siteVisitApis.list("site-1", {});

    expect(lastGetUrl()).not.toContain("?");
  });

  it("SHOULD serialize since/until as ISO strings", async () => {
    await siteVisitApis.list("site-1", {
      since: new Date("2026-08-01T00:00:00.000Z"),
      until: new Date("2026-08-02T00:00:00.000Z"),
    });

    const params = new URLSearchParams(lastGetUrl().split("?")[1]);
    expect(params.get("since")).toBe("2026-08-01T00:00:00.000Z");
    expect(params.get("until")).toBe("2026-08-02T00:00:00.000Z");
  });

  it("SHOULD forward the limit filter", async () => {
    await siteVisitApis.list("site-1", { limit: 50 });

    const params = new URLSearchParams(lastGetUrl().split("?")[1]);
    expect(params.get("limit")).toBe("50");
  });

  it("SHOULD rethrow WHEN the request fails", async () => {
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error("boom"));

    await expect(siteVisitApis.list("site-1")).rejects.toThrow("boom");
  });
});

describe("siteVisitApis.record", () => {
  it("SHOULD POST to the site's visits path with the given body", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ id: "visit-1" });

    await siteVisitApis.record("site-1", { visitedAt: "2026-09-01T00:00:00.000Z", note: "OK" });

    expect(httpClient.post).toHaveBeenCalledWith("/api/sites/site-1/visits", {
      visitedAt: "2026-09-01T00:00:00.000Z",
      note: "OK",
    });
  });

  it("SHOULD rethrow WHEN the request fails", async () => {
    vi.mocked(httpClient.post).mockRejectedValueOnce(new Error("boom"));

    await expect(
      siteVisitApis.record("site-1", { visitedAt: "2026-09-01T00:00:00.000Z" }),
    ).rejects.toThrow("boom");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { siteAlertThresholdsApis } from "../api-site-alert-thresholds";
import { httpClient } from "../http-client";

vi.mock("../http-client", () => ({
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

afterEach(() => vi.clearAllMocks());

describe("siteAlertThresholdsApis.get", () => {
  it("SHOULD GET the local proxy path for the site", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ siteId: "site-1", thresholds: null });

    await siteAlertThresholdsApis.get("site-1");

    expect(httpClient.get).toHaveBeenCalledWith("/api/sites/site-1/alert-thresholds");
  });

  it("SHOULD return the envelope as the backend sent it", async () => {
    const envelope = { siteId: "site-1", thresholds: null, effective: { values: {}, sources: {} } };
    vi.mocked(httpClient.get).mockResolvedValue(envelope);

    expect(await siteAlertThresholdsApis.get("site-1")).toBe(envelope);
  });

  it("SHOULD rethrow WHEN the request fails", async () => {
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error("boom"));

    await expect(siteAlertThresholdsApis.get("site-1")).rejects.toThrow("boom");
  });
});

describe("siteAlertThresholdsApis.update", () => {
  it("SHOULD PATCH the site's path with the partial body as given", async () => {
    vi.mocked(httpClient.patch).mockResolvedValue({ siteId: "site-1" });

    await siteAlertThresholdsApis.update("site-1", {
      offlineAfterMs: 7_200_000,
      firmwareStaleAfterMs: null,
    });

    expect(httpClient.patch).toHaveBeenCalledWith("/api/sites/site-1/alert-thresholds", {
      offlineAfterMs: 7_200_000,
      firmwareStaleAfterMs: null,
    });
  });

  it("SHOULD rethrow WHEN the request fails", async () => {
    vi.mocked(httpClient.patch).mockRejectedValueOnce(new Error("boom"));

    await expect(siteAlertThresholdsApis.update("site-1", {})).rejects.toThrow("boom");
  });
});

describe("siteAlertThresholdsApis.reset", () => {
  it("SHOULD DELETE the site's path", async () => {
    vi.mocked(httpClient.delete).mockResolvedValue(undefined);

    await siteAlertThresholdsApis.reset("site-1");

    expect(httpClient.delete).toHaveBeenCalledWith("/api/sites/site-1/alert-thresholds");
  });

  it("SHOULD rethrow WHEN the request fails", async () => {
    vi.mocked(httpClient.delete).mockRejectedValueOnce(new Error("boom"));

    await expect(siteAlertThresholdsApis.reset("site-1")).rejects.toThrow("boom");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { chargePointAlertThresholdsApis } from "../api-charge-points-alert-thresholds";
import { httpClient } from "../http-client";

vi.mock("../http-client", () => ({
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

afterEach(() => vi.clearAllMocks());

describe("chargePointAlertThresholdsApis.get", () => {
  it("SHOULD GET the local proxy path for the charge point", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ chargePointId: "cp-1", thresholds: null });

    await chargePointAlertThresholdsApis.get("cp-1");

    expect(httpClient.get).toHaveBeenCalledWith("/api/charge-points/cp-1/alert-thresholds");
  });

  it("SHOULD return the envelope as the backend sent it", async () => {
    const envelope = {
      chargePointId: "cp-1",
      thresholds: null,
      effective: { values: {}, sources: {} },
    };
    vi.mocked(httpClient.get).mockResolvedValue(envelope);

    expect(await chargePointAlertThresholdsApis.get("cp-1")).toBe(envelope);
  });

  it("SHOULD rethrow WHEN the request fails", async () => {
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error("boom"));

    await expect(chargePointAlertThresholdsApis.get("cp-1")).rejects.toThrow("boom");
  });
});

describe("chargePointAlertThresholdsApis.update", () => {
  it("SHOULD PATCH the charge point's path with the partial body as given", async () => {
    vi.mocked(httpClient.patch).mockResolvedValue({ chargePointId: "cp-1" });

    await chargePointAlertThresholdsApis.update("cp-1", {
      offlineAfterMs: 7_200_000,
      firmwareStaleAfterMs: null,
    });

    expect(httpClient.patch).toHaveBeenCalledWith("/api/charge-points/cp-1/alert-thresholds", {
      offlineAfterMs: 7_200_000,
      firmwareStaleAfterMs: null,
    });
  });

  it("SHOULD rethrow WHEN the request fails", async () => {
    vi.mocked(httpClient.patch).mockRejectedValueOnce(new Error("boom"));

    await expect(chargePointAlertThresholdsApis.update("cp-1", {})).rejects.toThrow("boom");
  });
});

describe("chargePointAlertThresholdsApis.reset", () => {
  it("SHOULD DELETE the charge point's path", async () => {
    vi.mocked(httpClient.delete).mockResolvedValue(undefined);

    await chargePointAlertThresholdsApis.reset("cp-1");

    expect(httpClient.delete).toHaveBeenCalledWith("/api/charge-points/cp-1/alert-thresholds");
  });

  it("SHOULD rethrow WHEN the request fails", async () => {
    vi.mocked(httpClient.delete).mockRejectedValueOnce(new Error("boom"));

    await expect(chargePointAlertThresholdsApis.reset("cp-1")).rejects.toThrow("boom");
  });
});

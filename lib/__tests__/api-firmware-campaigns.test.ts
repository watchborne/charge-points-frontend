import { afterEach, describe, expect, it, vi } from "vitest";

import { firmwareCampaignApis } from "../api-firmware-campaigns";
import { httpClient } from "../http-client";

vi.mock("../http-client", () => ({
  httpClient: {
    get: vi.fn().mockResolvedValue([]),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

afterEach(() => vi.clearAllMocks());

describe("firmwareCampaignApis.list", () => {
  it("SHOULD GET the firmware-campaigns list path", async () => {
    await firmwareCampaignApis.list();

    expect(httpClient.get).toHaveBeenCalledWith("/api/firmware-campaigns");
  });

  it("SHOULD rethrow WHEN the request fails", async () => {
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error("boom"));

    await expect(firmwareCampaignApis.list()).rejects.toThrow("boom");
  });
});

describe("firmwareCampaignApis.create", () => {
  it("SHOULD POST to the firmware-campaigns path with the given body", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ id: "campaign-1" });

    const body = {
      name: "Q3 rollout",
      targetLocation: "https://firmware.example.com/v2.4.0.bin",
      retrieveDateTime: "2026-10-01T00:00:00.000Z",
      targetMode: "FLEET" as const,
    };

    await firmwareCampaignApis.create(body);

    expect(httpClient.post).toHaveBeenCalledWith("/api/firmware-campaigns", body);
  });

  it("SHOULD rethrow WHEN the request fails", async () => {
    vi.mocked(httpClient.post).mockRejectedValueOnce(new Error("boom"));

    await expect(
      firmwareCampaignApis.create({
        name: "Q3 rollout",
        targetLocation: "https://firmware.example.com/v2.4.0.bin",
        retrieveDateTime: "2026-10-01T00:00:00.000Z",
        targetMode: "FLEET",
      }),
    ).rejects.toThrow("boom");
  });
});

describe("firmwareCampaignApis.getProgress", () => {
  it("SHOULD GET the campaign's detail path", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(null);

    await firmwareCampaignApis.getProgress("campaign-1");

    expect(httpClient.get).toHaveBeenCalledWith("/api/firmware-campaigns/campaign-1");
  });

  it("SHOULD return null WHEN the campaign is unknown or out of scope", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(null);

    await expect(firmwareCampaignApis.getProgress("campaign-1")).resolves.toBeNull();
  });

  it("SHOULD rethrow WHEN the request fails", async () => {
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error("boom"));

    await expect(firmwareCampaignApis.getProgress("campaign-1")).rejects.toThrow("boom");
  });
});

describe("firmwareCampaignApis.cancel", () => {
  it("SHOULD DELETE the campaign's path", async () => {
    vi.mocked(httpClient.delete).mockResolvedValue(undefined);

    await firmwareCampaignApis.cancel("campaign-1");

    expect(httpClient.delete).toHaveBeenCalledWith("/api/firmware-campaigns/campaign-1");
  });

  it("SHOULD rethrow WHEN the request fails", async () => {
    vi.mocked(httpClient.delete).mockRejectedValueOnce(new Error("boom"));

    await expect(firmwareCampaignApis.cancel("campaign-1")).rejects.toThrow("boom");
  });
});

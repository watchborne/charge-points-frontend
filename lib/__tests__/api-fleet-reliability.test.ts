import { afterEach, describe, expect, it, vi } from "vitest";

import { fleetReliabilityApis } from "../api-fleet-reliability";
import { httpClient } from "../http-client";

vi.mock("../http-client", () => ({
  httpClient: { get: vi.fn().mockResolvedValue({ chargePoints: [] }) },
}));

const lastUrl = () => vi.mocked(httpClient.get).mock.calls.at(-1)?.[0] as string;

afterEach(() => vi.clearAllMocks());

describe("fleetReliabilityApis.getFleetReliability", () => {
  it("SHOULD hit the local proxy path", async () => {
    await fleetReliabilityApis.getFleetReliability();

    expect(lastUrl()).toBe("/api/charge-points/reliability");
  });

  it("SHOULD send no query string WHEN no window is given", async () => {
    await fleetReliabilityApis.getFleetReliability({});

    expect(lastUrl()).not.toContain("?");
  });

  it("SHOULD serialize from/to as ISO strings", async () => {
    await fleetReliabilityApis.getFleetReliability({
      from: new Date("2026-08-01T00:00:00.000Z"),
      to: new Date("2026-08-31T00:00:00.000Z"),
    });

    const params = new URLSearchParams(lastUrl().split("?")[1]);
    expect(params.get("from")).toBe("2026-08-01T00:00:00.000Z");
    expect(params.get("to")).toBe("2026-08-31T00:00:00.000Z");
  });

  it("SHOULD rethrow WHEN the request fails, so the caller can surface it", async () => {
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error("boom"));

    await expect(fleetReliabilityApis.getFleetReliability()).rejects.toThrow("boom");
  });
});

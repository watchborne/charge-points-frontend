import { afterEach, describe, expect, it, vi } from "vitest";

import { isCumulativeRegister, meteringApis } from "../api-metering";
import { httpClient } from "../http-client";

vi.mock("../http-client", () => ({
  httpClient: { get: vi.fn().mockResolvedValue([]) },
}));

const lastUrl = () => vi.mocked(httpClient.get).mock.calls.at(-1)?.[0] as string;

afterEach(() => vi.clearAllMocks());

describe("isCumulativeRegister", () => {
  it("SHOULD treat a .Register measurand as cumulative", () => {
    expect(isCumulativeRegister("Energy.Active.Import.Register")).toBe(true);
    expect(isCumulativeRegister("Energy.Reactive.Export.Register")).toBe(true);
  });

  it("SHOULD treat a spot reading as not cumulative", () => {
    expect(isCumulativeRegister("Power.Active.Import")).toBe(false);
    expect(isCumulativeRegister("Voltage")).toBe(false);
    expect(isCumulativeRegister("SoC")).toBe(false);
  });

  it("SHOULD only match the suffix, not the word anywhere in the name", () => {
    expect(isCumulativeRegister("Register.Something")).toBe(false);
  });
});

describe("meteringApis.getMeterSamples", () => {
  it("SHOULD hit the local proxy path for the charge point", async () => {
    await meteringApis.getMeterSamples("cp-1");

    expect(lastUrl()).toBe("/api/charge-points/cp-1/meter-samples");
  });

  it("SHOULD send no query string WHEN no filter is given, letting the backend default the window", async () => {
    await meteringApis.getMeterSamples("cp-1", {});

    expect(lastUrl()).not.toContain("?");
  });

  it("SHOULD serialize the window as ISO strings", async () => {
    await meteringApis.getMeterSamples("cp-1", {
      from: new Date("2026-08-01T00:00:00.000Z"),
      to: new Date("2026-08-02T00:00:00.000Z"),
    });

    const params = new URLSearchParams(lastUrl().split("?")[1]);
    expect(params.get("from")).toBe("2026-08-01T00:00:00.000Z");
    expect(params.get("to")).toBe("2026-08-02T00:00:00.000Z");
  });

  it("SHOULD repeat ?measurand= per measurand rather than collapsing them", async () => {
    await meteringApis.getMeterSamples("cp-1", { measurands: ["Voltage", "SoC"] });

    const params = new URLSearchParams(lastUrl().split("?")[1]);
    expect(params.getAll("measurand")).toEqual(["Voltage", "SoC"]);
  });

  it("SHOULD forward the connector and limit filters", async () => {
    await meteringApis.getMeterSamples("cp-1", { connectorId: 2, limit: 500 });

    const params = new URLSearchParams(lastUrl().split("?")[1]);
    expect(params.get("connectorId")).toBe("2");
    expect(params.get("limit")).toBe("500");
  });
});

describe("meteringApis.getConsumption", () => {
  it("SHOULD hit the consumption path with the same window serialization", async () => {
    await meteringApis.getConsumption("cp-1", { from: new Date("2026-08-01T00:00:00.000Z") });

    expect(lastUrl()).toContain("/api/charge-points/cp-1/consumption?");
    expect(lastUrl()).toContain("from=2026-08-01T00%3A00%3A00.000Z");
  });

  it("SHOULD rethrow WHEN the request fails, so the caller can surface it", async () => {
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error("boom"));

    await expect(meteringApis.getConsumption("cp-1")).rejects.toThrow("boom");
  });
});

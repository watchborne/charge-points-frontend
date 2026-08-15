import { afterEach, describe, expect, it, vi } from "vitest";

import { statusHistoryApis } from "../api-status-history";
import { httpClient } from "../http-client";

vi.mock("../http-client", () => ({
  httpClient: { get: vi.fn().mockResolvedValue([]) },
}));

const lastUrl = () => vi.mocked(httpClient.get).mock.calls.at(-1)?.[0] as string;

afterEach(() => vi.clearAllMocks());

describe("statusHistoryApis.getConnectionEvents", () => {
  it("SHOULD hit the local proxy path for the charge point", async () => {
    await statusHistoryApis.getConnectionEvents("cp-1");

    expect(lastUrl()).toBe("/api/charge-points/cp-1/connection-events");
  });

  it("SHOULD send no query string WHEN no filter is given", async () => {
    await statusHistoryApis.getConnectionEvents("cp-1", {});

    expect(lastUrl()).not.toContain("?");
  });

  it("SHOULD serialize since/until as ISO strings", async () => {
    await statusHistoryApis.getConnectionEvents("cp-1", {
      since: new Date("2026-08-01T00:00:00.000Z"),
      until: new Date("2026-08-02T00:00:00.000Z"),
    });

    const params = new URLSearchParams(lastUrl().split("?")[1]);
    expect(params.get("since")).toBe("2026-08-01T00:00:00.000Z");
    expect(params.get("until")).toBe("2026-08-02T00:00:00.000Z");
  });

  it("SHOULD forward the limit filter", async () => {
    await statusHistoryApis.getConnectionEvents("cp-1", { limit: 500 });

    const params = new URLSearchParams(lastUrl().split("?")[1]);
    expect(params.get("limit")).toBe("500");
  });

  it("SHOULD rethrow WHEN the request fails, so the caller can surface it", async () => {
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error("boom"));

    await expect(statusHistoryApis.getConnectionEvents("cp-1")).rejects.toThrow("boom");
  });
});

describe("statusHistoryApis.getConnectorStatusEvents", () => {
  it("SHOULD hit the connector-status-events path", async () => {
    await statusHistoryApis.getConnectorStatusEvents("cp-1");

    expect(lastUrl()).toBe("/api/charge-points/cp-1/connector-status-events");
  });

  it("SHOULD forward connectorId 0 (the whole-charge-point entry), not omit it as falsy", async () => {
    await statusHistoryApis.getConnectorStatusEvents("cp-1", { connectorId: 0 });

    const params = new URLSearchParams(lastUrl().split("?")[1]);
    expect(params.get("connectorId")).toBe("0");
  });

  it("SHOULD forward the connector, since, until and limit filters together", async () => {
    await statusHistoryApis.getConnectorStatusEvents("cp-1", {
      connectorId: 2,
      since: new Date("2026-08-01T00:00:00.000Z"),
      until: new Date("2026-08-02T00:00:00.000Z"),
      limit: 500,
    });

    const params = new URLSearchParams(lastUrl().split("?")[1]);
    expect(params.get("connectorId")).toBe("2");
    expect(params.get("since")).toBe("2026-08-01T00:00:00.000Z");
    expect(params.get("until")).toBe("2026-08-02T00:00:00.000Z");
    expect(params.get("limit")).toBe("500");
  });

  it("SHOULD rethrow WHEN the request fails", async () => {
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error("boom"));

    await expect(statusHistoryApis.getConnectorStatusEvents("cp-1")).rejects.toThrow("boom");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { commissioningTokenApis } from "../api-commissioning-token";
import { httpClient } from "../http-client";

vi.mock("../http-client", () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

afterEach(() => vi.clearAllMocks());

describe("commissioningTokenApis.issueToken", () => {
  it("SHOULD POST an empty body WHEN no maximum is given", async () => {
    await commissioningTokenApis.issueToken();

    expect(httpClient.post).toHaveBeenCalledWith("/api/me/commissioning-token", {});
  });

  it("SHOULD POST an empty body WHEN the maximum is null", async () => {
    await commissioningTokenApis.issueToken(null);

    expect(httpClient.post).toHaveBeenCalledWith("/api/me/commissioning-token", {});
  });

  it("SHOULD POST the maximum WHEN one is given", async () => {
    await commissioningTokenApis.issueToken(5);

    expect(httpClient.post).toHaveBeenCalledWith("/api/me/commissioning-token", { maxUses: 5 });
  });
});

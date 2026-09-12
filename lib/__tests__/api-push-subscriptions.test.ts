import { afterEach, describe, expect, it, vi } from "vitest";

import { pushSubscriptionApis } from "../api-push-subscriptions";
import { httpClient } from "../http-client";

vi.mock("../http-client", () => ({
  httpClient: { post: vi.fn(), delete: vi.fn() },
}));

afterEach(() => vi.clearAllMocks());

describe("pushSubscriptionApis.subscribe", () => {
  it("SHOULD POST endpoint and keys to the local proxy path", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      endpoint: "https://push.example/abc",
      createdAt: "2026-09-01T00:00:00.000Z",
    });

    await pushSubscriptionApis.subscribe("https://push.example/abc", {
      p256dh: "p256dh-value",
      auth: "auth-value",
    });

    expect(httpClient.post).toHaveBeenCalledWith("/api/me/push-subscriptions", {
      endpoint: "https://push.example/abc",
      keys: { p256dh: "p256dh-value", auth: "auth-value" },
    });
  });

  it("SHOULD return the backend's response", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      endpoint: "https://push.example/abc",
      createdAt: "2026-09-01T00:00:00.000Z",
    });

    const result = await pushSubscriptionApis.subscribe("https://push.example/abc", {
      p256dh: "p256dh-value",
      auth: "auth-value",
    });

    expect(result).toEqual({
      endpoint: "https://push.example/abc",
      createdAt: "2026-09-01T00:00:00.000Z",
    });
  });

  it("SHOULD rethrow WHEN the request fails", async () => {
    vi.mocked(httpClient.post).mockRejectedValueOnce(new Error("boom"));

    await expect(
      pushSubscriptionApis.subscribe("https://push.example/abc", {
        p256dh: "p256dh-value",
        auth: "auth-value",
      }),
    ).rejects.toThrow("boom");
  });
});

describe("pushSubscriptionApis.unsubscribe", () => {
  it("SHOULD DELETE with the endpoint in the body", async () => {
    vi.mocked(httpClient.delete).mockResolvedValue(undefined);

    await pushSubscriptionApis.unsubscribe("https://push.example/abc");

    expect(httpClient.delete).toHaveBeenCalledWith("/api/me/push-subscriptions", {
      endpoint: "https://push.example/abc",
    });
  });

  it("SHOULD rethrow WHEN the request fails", async () => {
    vi.mocked(httpClient.delete).mockRejectedValueOnce(new Error("boom"));

    await expect(pushSubscriptionApis.unsubscribe("https://push.example/abc")).rejects.toThrow(
      "boom",
    );
  });
});

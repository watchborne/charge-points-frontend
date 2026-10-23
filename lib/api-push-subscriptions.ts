import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// The /api/me/push-subscriptions contract; `PushSubscription` is
// server-local.
export type PushSubscriptionKeys = {
  p256dh: string;
  auth: string;
};

export type SubscribedPushSubscription = {
  endpoint: string;
  createdAt: string;
};

export const pushSubscriptionApis = {
  /**
   * Upserts this browser's subscription (idempotent on `endpoint`, so safe
   * after a `pushsubscriptionchange`), with the browser's user agent.
   */
  subscribe: async function (
    endpoint: string,
    keys: PushSubscriptionKeys,
  ): Promise<SubscribedPushSubscription> {
    return withErrorLogging(
      () =>
        httpClient.post<SubscribedPushSubscription>("/api/me/push-subscriptions", {
          endpoint,
          keys,
          // In the body: the proxy hop would send the Next server's
          // User-Agent. Used to tell devices and browsers apart.
          userAgent: typeof navigator === "undefined" ? undefined : navigator.userAgent,
        }),
      "PushSubscriptions.subscribe",
    );
  },

  /**
   * Removes this browser's subscription. Always resolves: the backend answers
   * 204 even for an unknown endpoint.
   */
  unsubscribe: async function (endpoint: string): Promise<void> {
    return withErrorLogging(
      () => httpClient.delete("/api/me/push-subscriptions", { endpoint }),
      "PushSubscriptions.unsubscribe",
    );
  },
};

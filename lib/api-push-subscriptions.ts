import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// The Web Push subscription envelope charge-points-server's
// /api/me/push-subscriptions routes accept/return. Not part of
// @watchborne/charge-points-types, same reasoning as CommissioningToken/
// SiteVisit/SecurityEvent/Me above: `PushSubscription` is kept server-local
// (charge-points-server issues #587-590), so this response contract is the
// shared surface a client codes against.
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
   * Upserts this browser's Web Push subscription. Idempotent on `endpoint`
   * server-side, so calling it again with the same subscription (e.g. after
   * a `pushsubscriptionchange`) is safe.
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
        }),
      "PushSubscriptions.subscribe",
    );
  },

  /**
   * Removes this browser's Web Push subscription. Always resolves — the
   * backend returns 204 unconditionally, scoped to the caller's own
   * subscriptions, so an endpoint that was never registered (or already
   * removed) is not an error.
   */
  unsubscribe: async function (endpoint: string): Promise<void> {
    return withErrorLogging(
      () => httpClient.delete("/api/me/push-subscriptions", { endpoint }),
      "PushSubscriptions.unsubscribe",
    );
  },
};

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { VAPID_PUBLIC_KEY } from "@/lib/constants";
import { reportError } from "@/lib/report-error";

const SERVICE_WORKER_URL = "/sw.js";

/**
 * base64url VAPID key to the `Uint8Array` `PushManager.subscribe` wants.
 * `public/sw.js` has its own copy: a service worker can't import app modules.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function getOrRegisterServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
  if (!existing) {
    await navigator.serviceWorker.register(SERVICE_WORKER_URL);
  }

  // `register()` resolves before a new worker is active, and
  // `pushManager.subscribe()` needs an active one: `.ready` waits for it.
  return navigator.serviceWorker.ready;
}

export type UsePushSubscriptionReturn = {
  isSupported: boolean;
  permission: NotificationPermission | null;
  isSubscribed: boolean;
  /**
   * Resolves to the permission outcome (`"granted"`/`"denied"`/`"default"`),
   * or `null` when permission was never requested (VAPID key unset).
   * `"denied"` is an outcome, not a rejection.
   */
  subscribe: () => Promise<NotificationPermission | null>;
  unsubscribe: () => Promise<void>;
  isSubscribing: boolean;
  isPending: boolean;
};

/**
 * Web Push subscription: registers the service worker, requests permission
 * and subscribes/unsubscribes through `api.PushSubscriptions`. `isSubscribed`
 * is checked against the browser on mount, so the toggle reflects reality.
 */
export function usePushSubscription(): UsePushSubscriptionReturn {
  const isSupported =
    typeof navigator !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

  const [permission, setPermission] = useState<NotificationPermission | null>(() =>
    typeof Notification !== "undefined" ? Notification.permission : null,
  );
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!isSupported) return;

    let cancelled = false;

    (async () => {
      const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
      const subscription = await registration?.pushManager.getSubscription();
      if (!cancelled) setIsSubscribed(Boolean(subscription));
    })();

    return () => {
      cancelled = true;
    };
    // isSupported never changes across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribeMutation = useMutation({
    mutationFn: async (): Promise<NotificationPermission | null> => {
      if (!isSupported) {
        throw new Error("Push notifications are not supported in this browser.");
      }

      if (!VAPID_PUBLIC_KEY) {
        // Soft-fail like lib/constants.ts's SUPABASE_URL: report and stop,
        // rather than let subscribe throw on an empty key.
        reportError(
          new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set — cannot subscribe."),
          "usePushSubscription.subscribe",
        );
        return null;
      }

      const registration = await getOrRegisterServiceWorker();
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") return result;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Some lib.dom.d.ts versions don't see Uint8Array as a BufferSource.
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      const { endpoint, keys } = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      await api.PushSubscriptions.subscribe(endpoint, keys);

      // public/sw.js can't read env vars: hand it the key so a
      // `pushsubscriptionchange` can resubscribe.
      registration.active?.postMessage({
        type: "SET_VAPID_PUBLIC_KEY",
        key: VAPID_PUBLIC_KEY,
      });

      return result;
    },
    onSuccess: (result) => {
      if (result === "granted") setIsSubscribed(true);
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!isSupported) return;

      const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) return;

      // Browser first: local, so it can't fail on the network or an expired
      // session. The backend call is best-effort; a dead endpoint is pruned
      // on the next send (404/410).
      const { endpoint } = subscription;
      await subscription.unsubscribe();

      try {
        await api.PushSubscriptions.unsubscribe(endpoint);
      } catch (error) {
        reportError(error, "usePushSubscription.unsubscribe");
      }
    },
    // Always ends "not subscribed", whatever there was to tear down.
    onSuccess: () => setIsSubscribed(false),
  });

  return {
    isSupported,
    permission,
    isSubscribed,
    subscribe: () => subscribeMutation.mutateAsync(),
    unsubscribe: () => unsubscribeMutation.mutateAsync(),
    isSubscribing: subscribeMutation.isPending,
    isPending: subscribeMutation.isPending || unsubscribeMutation.isPending,
  };
}

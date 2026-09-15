import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { api } from "@/lib/api";
import { VAPID_PUBLIC_KEY } from "@/lib/constants";

// Same-origin static asset (public/sw.js) — Next.js serves public/ untouched,
// so this is a plain root-relative path, not an import.
const SERVICE_WORKER_URL = "/sw.js";

/**
 * VAPID keys are distributed base64url-encoded; `PushManager.subscribe`'s
 * `applicationServerKey` wants a raw Uint8Array. Standard, well-known
 * ~10-line conversion — not worth a dependency. `public/sw.js` keeps its own
 * copy of this same helper: a service worker can't import a module from the
 * app bundle, so it can't share this one.
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
  return existing ?? navigator.serviceWorker.register(SERVICE_WORKER_URL);
}

export type UsePushSubscriptionReturn = {
  isSupported: boolean;
  permission: NotificationPermission | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  isSubscribing: boolean;
};

/**
 * Web Push subscription plumbing (charge-points-frontend issue #400, first
 * PR of the Web Push notification-channel epic; backend half is
 * charge-points-server issues #587-590). Deliberately exposes nothing beyond
 * what #401's settings toggle needs — registering the service worker,
 * requesting permission, and subscribing/unsubscribing through
 * `api.PushSubscriptions` — and is not mounted anywhere yet; #401 renders the
 * toggle that calls it.
 *
 * Built on `useMutation` rather than local `useState`/try-catch, mirroring
 * `useSiteVisits`'s `recordVisit` — both are one-shot actions against a
 * backend endpoint, not cached server state to `useQuery`, so there is
 * nothing here to list or invalidate.
 */
export function usePushSubscription(): UsePushSubscriptionReturn {
  const isSupported =
    typeof navigator !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

  const [permission, setPermission] = useState<NotificationPermission | null>(() =>
    typeof Notification !== "undefined" ? Notification.permission : null,
  );

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!isSupported) {
        throw new Error("Push notifications are not supported in this browser.");
      }

      if (!VAPID_PUBLIC_KEY) {
        // Soft-fail, matching lib/constants.ts's own precedent for a
        // required-but-possibly-unset public env var read in the browser
        // (see SUPABASE_URL there): log clearly and stop, rather than let
        // pushManager.subscribe throw on an empty applicationServerKey.
        console.error(
          "[usePushSubscription] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set — cannot subscribe.",
        );
        return;
      }

      const registration = await getOrRegisterServiceWorker();
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Cast needed regardless of the exact TypeScript/lib.dom.d.ts pairing:
        // some combinations type a generic Uint8Array<ArrayBufferLike> as not
        // structurally assignable to BufferSource, even though it always is
        // one at runtime.
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      const { endpoint, keys } = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      await api.PushSubscriptions.subscribe(endpoint, keys);

      // public/sw.js can't read NEXT_PUBLIC_* env vars (it's an unbundled
      // static asset) — hand it the key so a later `pushsubscriptionchange`
      // can resubscribe with an equivalent one. See sw.js's own comment for
      // why this postMessage handoff is the chosen approach.
      registration.active?.postMessage({
        type: "SET_VAPID_PUBLIC_KEY",
        key: VAPID_PUBLIC_KEY,
      });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!isSupported) return;

      const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) return;

      await api.PushSubscriptions.unsubscribe(subscription.endpoint);
      await subscription.unsubscribe();
    },
  });

  return {
    isSupported,
    permission,
    subscribe: () => subscribeMutation.mutateAsync(),
    unsubscribe: () => unsubscribeMutation.mutateAsync(),
    isSubscribing: subscribeMutation.isPending,
  };
}

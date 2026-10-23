"use strict";

/**
 * Service worker for Web Push, registered by
 * app/[locale]/app/hooks/usePushSubscription.ts.
 *
 * Plain JS served as-is from `public/`: no imports, no TypeScript, no
 * `process.env`. The VAPID public key `pushsubscriptionchange` needs is
 * therefore sent by the page via `postMessage` after registration and kept in
 * a module-scope variable. A worker restart clears it; a later
 * `pushsubscriptionchange` then skips, and the subscription is refreshed the
 * next time the app is opened.
 */
let cachedVapidPublicKey = null;

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_VAPID_PUBLIC_KEY") {
    cachedVapidPublicKey = event.data.key;
  }
});

/**
 * base64url VAPID key to a `Uint8Array`. Duplicated in usePushSubscription.ts:
 * a service worker can't import app modules.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = self.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let payload = {};
      try {
        // The shape the backend's PushPayload sends.
        payload = event.data ? event.data.json() : {};
      } catch {
        // Not JSON, or no data: fall back to a generic notification.
      }

      const title = payload.title || "watchborne";
      const options = {
        body: payload.body || "",
        // No badge: a badge needs a small monochrome PNG, which public/ lacks.
        icon: "/favicon.svg",
        data: { url: payload.url || "/" },
      };

      await self.registration.showNotification(title, options);
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.notification.close();

  event.waitUntil(
    (async () => {
      const windowClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = windowClients.find((client) => client.url === url);

      if (existing) {
        await existing.focus();
        return;
      }

      await clients.openWindow(url);
    })(),
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      if (!cachedVapidPublicKey) {
        // No cached key (worker restarted): skip, don't throw.
        return;
      }

      try {
        const subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(cachedVapidPublicKey),
        });
        const { endpoint, keys } = subscription.toJSON();

        // Same-origin: the session cookie goes along, and the API route
        // forwards the bearer token to the backend.
        await fetch("/api/me/push-subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint, keys }),
        });
      } catch {
        // Best-effort: nothing else can react to this event, and swallowing
        // here is the whole point — a failed resubscribe must not surface as
        // an unhandled rejection in the worker.
      }
    })(),
  );
});

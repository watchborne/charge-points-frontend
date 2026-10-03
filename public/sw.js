"use strict";

/**
 * Service worker for Web Push notifications (charge-points-frontend issue
 * #400 — plumbing only; the settings toggle that registers this worker and
 * calls subscribe()/unsubscribe() ships in #401, via
 * app/[locale]/app/hooks/usePushSubscription.ts).
 *
 * Plain, unbundled JS on purpose: Next.js serves everything under `public/`
 * as-is (no webpack/Turbopack pass), so this file cannot `import` anything,
 * use TypeScript, or read `process.env` — it also runs in its own worker
 * global scope, not the page's, so `self`/`clients`/`registration` replace
 * `window`/`document`.
 *
 * VAPID PUBLIC KEY — how it gets in here:
 * `pushsubscriptionchange` below needs the same VAPID public key the page's
 * original `pushManager.subscribe()` call used, to re-subscribe with an
 * equivalent key when the browser silently renews a subscription (rotated
 * keys or an approaching expiry). A service worker has no `process.env`, and
 * this file is a static asset the build never templates — so the key can't
 * just be inlined at build time the way a bundled module could read
 * `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. Rather than add a bundler step for this one
 * file, or a dedicated "give me the public key" endpoint, the simplest
 * correct fix is: the page already has the key (it's `NEXT_PUBLIC_`, so it's
 * in the browser bundle already) and hands it to this worker via
 * `postMessage` right after registering it; this worker just remembers it in
 * the module-scope variable below.
 *
 * Caveat, deliberately accepted for this first plumbing PR: the browser can
 * stop and restart a service worker at any time, including with no tab of
 * this app open, which clears module-scope state. If `pushsubscriptionchange`
 * fires after such a restart, there is no cached key to resubscribe with —
 * see the early return below, which skips rather than throws. The
 * subscription then goes stale until the app is next opened (which
 * re-registers, permission already granted, and re-sends the key). Fixing
 * that fully would mean persisting the key in IndexedDB from inside the
 * worker; not worth the added complexity for what `pushsubscriptionchange`
 * itself already documents as a rare event.
 */
let cachedVapidPublicKey = null;

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_VAPID_PUBLIC_KEY") {
    cachedVapidPublicKey = event.data.key;
  }
});

/**
 * VAPID keys are distributed base64url-encoded; `applicationServerKey` wants
 * a raw Uint8Array. Standard, well-known ~10-line conversion — not worth a
 * dependency. Kept duplicated (not imported) in
 * app/[locale]/app/hooks/usePushSubscription.ts, which needs the same
 * conversion on the page side: a service worker can't import a module from
 * the app bundle.
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
        // Exactly the shape charge-points-server's PushPayload sends.
        payload = event.data ? event.data.json() : {};
      } catch {
        // Not JSON (or no data at all) — fall back to a generic notification
        // below rather than dropping the push silently.
      }

      const title = payload.title || "watchborne";
      const options = {
        body: payload.body || "",
        // /favicon.svg is the only app-wide icon asset public/ ships today;
        // reused here rather than adding a dedicated PNG for this first PR.
        // No suitable badge asset exists (a badge wants a small monochrome
        // PNG), so it's omitted rather than pointed at something that would
        // render wrong.
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
        // See the module-scope caveat above — nothing safe to resubscribe
        // with. Best-effort: skip, don't throw.
        return;
      }

      try {
        const subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(cachedVapidPublicKey),
        });
        const { endpoint, keys } = subscription.toJSON();

        // Same-origin fetch: the Next.js route handler
        // (app/api/me/push-subscriptions/route.ts) resolves the caller's
        // Supabase session itself server-side via createClient() (see
        // lib/proxy-request.ts) and attaches the bearer token to the backend
        // call from there — it isn't this fetch's job to carry an
        // Authorization header, only the browser's own session cookie, which
        // a same-origin fetch sends by default.
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

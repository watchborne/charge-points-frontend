import { createClient } from "@/lib/supabase/client";

/**
 * The refresh currently in flight, shared by every caller that asks while it
 * runs. Cleared once it settles: this deduplicates a *burst* of concurrent
 * requests, it does not cache the outcome — a later burst must be free to
 * refresh again, since the token it finds may have expired since.
 */
let inFlight: Promise<void> | null = null;

/**
 * Refreshes the browser's Supabase session before an API request goes out, so
 * the cookie that request carries is one the server can use as-is.
 *
 * Without this, a dashboard startup fires several `/api/*` calls in parallel
 * holding an expired access token, and each one is refreshed independently by
 * its own isolated Netlify Edge Function invocation. Supabase rotates refresh
 * tokens with a reuse-detection window, so concurrent refreshes of the *same*
 * token do not collapse into one — they contend, and the first dashboard load
 * cost 5–6 s (issue #349, root cause of charge-points-server#488). Doing it
 * here instead moves the refresh into the browser client, which serializes
 * behind a lock: one refresh, however many callers ask at once.
 *
 * A no-op on the server — there is no browser cookie store to refresh there,
 * and the browser client has no business being constructed.
 *
 * **Never rejects.** A failed refresh must not turn into a failed API call:
 * the request goes out with whatever session it has, and the backend decides,
 * answering 401 when the token is unusable (charge-points-server ADR 0002).
 * That is also why `createClient()` is constructed inside the promise chain —
 * it throws synchronously when the Supabase env vars are unset, and that must
 * be swallowed like any other refresh failure.
 */
export function ensureFreshSession(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (inFlight) return inFlight;

  inFlight = Promise.resolve()
    .then(() => createClient().auth.getSession())
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

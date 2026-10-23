import { createClient } from "@/lib/supabase/client";

/**
 * The refresh in flight, shared by concurrent callers and cleared once
 * settled: it deduplicates a burst, it doesn't cache the outcome.
 */
let inFlight: Promise<void> | null = null;

/**
 * Refreshes the browser's Supabase session before an API request, so the
 * cookie it carries is usable as-is. Otherwise parallel requests with an
 * expired token each refresh it in their own edge invocation, and Supabase's
 * refresh-token reuse detection makes them contend. The browser client
 * serializes behind a lock: one refresh per burst. No-op on the server.
 *
 * **Never rejects:** the request goes out with whatever session it has and the
 * backend answers 401 if unusable. `createClient()` is called inside the chain
 * because it throws when the Supabase env vars are unset.
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

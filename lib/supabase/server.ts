import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/constants";

/**
 * Supabase client for use in Route Handlers and Server Components. It reads the
 * session from the incoming request cookies via `next/headers`.
 *
 * `setAll` is a no-op when called from a Server Component, where the cookie
 * store is read-only — the middleware (`lib/supabase/middleware.ts`) is
 * responsible for refreshing the session cookie on each request, so swallowing
 * that error here is safe.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component with a read-only cookie store.
        }
      },
    },
  });
}

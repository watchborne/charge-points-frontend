import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/constants";

/**
 * Builds a Supabase client bound to the middleware's request/response pair,
 * so the auth session cookie refreshes on every request.
 *
 * Returns:
 * - `supabase` — call `auth.getUser()` for the authenticated user.
 * - `supabaseResponse` — a `NextResponse` carrying refreshed session
 *   cookies. Callers must return this (or copy its cookies onto their own
 *   redirect/rewrite response) so the refreshed session reaches the browser.
 *
 * The canonical `@supabase/ssr` middleware pattern; route-guarding logic
 * lives in the root `middleware.ts`, not here.
 */
export function createClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  return { supabase, supabaseResponse };
}

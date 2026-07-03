import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/constants";

/**
 * Builds a Supabase client bound to the middleware's request/response pair so
 * the auth session cookie is refreshed on every request.
 *
 * Returns:
 * - `supabase` — call `auth.getUser()` to read the authenticated user.
 * - `supabaseResponse` — a `NextResponse` carrying any refreshed session
 *   cookies. Callers must return this response (or copy its cookies onto their
 *   own redirect/rewrite response) so the refreshed session reaches the browser.
 *
 * This is the canonical `@supabase/ssr` middleware pattern; the route-guarding
 * logic lives in the root `middleware.ts`, not here.
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

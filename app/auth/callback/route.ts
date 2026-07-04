import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link redirect target (see LoginForm's `emailRedirectTo`). Exchanges the
 * one-time code for a session — this sets the Supabase auth cookies via the
 * server client's cookie adapter — then sends the user into the dashboard.
 *
 * Any failure (missing code, expired/already-used link) falls back to /login;
 * there's no session to guard against at that point, so the middleware would
 * bounce an unauthenticated /app/dashboard visit there anyway.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/app/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}

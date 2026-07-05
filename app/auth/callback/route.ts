import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link redirect target: the email template (emails/templates/magic-link.html)
 * links to Supabase's hosted `{{ .ConfirmationURL }}` (/auth/v1/verify), which
 * verifies the OTP and redirects here with a PKCE `code`. Exchanging it for a
 * session sets the Supabase auth cookies via the server client's cookie adapter,
 * then sends the user into the dashboard.
 *
 * Any failure (missing code, expired/already-used link) falls back to /login;
 * there's no session to guard against at that point, so the middleware would
 * bounce an unauthenticated /app/dashboard visit there anyway.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/app/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}

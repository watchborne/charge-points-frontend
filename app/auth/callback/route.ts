import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link redirect target: the email template (emails/templates/magic-link.html)
 * links to Supabase's hosted `{{ .ConfirmationURL }}` (/auth/v1/verify), which
 * verifies the OTP and redirects here with a PKCE `code`. Exchanging it for a
 * session sets the Supabase auth cookies via the server client's cookie adapter,
 * then sends the user into the dashboard.
 *
 * Any failure falls back to /login; there's no session to guard against at that
 * point, so the middleware would bounce an unauthenticated /app/dashboard visit
 * there anyway. When the link itself is expired/already-used, Supabase's hosted
 * verify step never reaches us with a `code` — it redirects straight here with
 * `error`/`error_code`/`error_description` instead, which we forward onto /login
 * so `AuthErrorCallout` can explain the failure instead of failing silently.
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

  const loginUrl = new URL("/login", origin);
  const errorCode = searchParams.get("error_code");
  if (errorCode) {
    loginUrl.searchParams.set("error_code", errorCode);
  }

  return NextResponse.redirect(loginUrl);
}

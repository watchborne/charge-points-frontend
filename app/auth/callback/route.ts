import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Edge runtime avoids Node.js serverless cold starts on this hop.
export const runtime = "edge";

/**
 * Magic-link redirect target: the email template (emails/templates/magic-link.html)
 * links to Supabase's hosted `{{ .ConfirmationURL }}` (/auth/v1/verify), which
 * verifies the OTP and redirects here with a PKCE `code`. Exchanging it for a
 * session sets the Supabase auth cookies via the server client's cookie adapter,
 * then sends the user into the dashboard.
 *
 * Any failure falls back to /login; there's no session to guard against at that
 * point, so the middleware would bounce an unauthenticated /app/dashboard visit
 * there anyway. Two distinct failure sources are forwarded as `error_code` so
 * `AuthErrorCallout` can explain them instead of failing silently:
 * - Supabase's hosted verify step rejecting an expired/already-used link never
 *   reaches us with a `code` at all — it redirects straight here with
 *   `error`/`error_code`/`error_description` instead, which we pass through.
 * - `exchangeCodeForSession` itself failing (most commonly: the link was opened
 *   in a different browser/profile than the one that requested it, so the PKCE
 *   `code_verifier` cookie set by `signInWithOtp` isn't present) — we map that
 *   to our own `exchange_failed` marker, distinct from Supabase's own codes.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let errorCode = searchParams.get("error_code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/app/dashboard`);
    }

    errorCode = "exchange_failed";
  }

  const loginUrl = new URL("/login", origin);
  if (errorCode) {
    loginUrl.searchParams.set("error_code", errorCode);
  }

  return NextResponse.redirect(loginUrl);
}

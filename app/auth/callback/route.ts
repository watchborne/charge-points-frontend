import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link redirect target: the email template (emails/templates/magic-link.html)
 * links directly here with `token_hash` and `type=magiclink`, bypassing Supabase's
 * hosted /auth/v1/verify redirect. Verifying the token hash sets the Supabase auth
 * cookies via the server client's cookie adapter, then sends the user into the
 * dashboard.
 *
 * Any failure (missing params, expired/already-used link) falls back to /login;
 * there's no session to guard against at that point, so the middleware would
 * bounce an unauthenticated /app/dashboard visit there anyway.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      return NextResponse.redirect(`${origin}/app/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}

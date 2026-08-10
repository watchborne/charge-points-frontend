import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Local-dev-only shortcut around the real OTP-code email round-trip.
 *
 * Returns the code itself (`properties.email_otp` from the admin API)
 * instead of creating a session server-side: `DevLoginShortcut` feeds it into
 * `VerifyOtpForm`, which runs the exact same client-side
 * `supabase.auth.verifyOtp` call a real user's browser would after reading
 * the code from their inbox. Local dev still skips the real email, but now
 * exercises the actual sign-in path instead of a server-side shortcut around
 * it — unlike this route's magic-link-era version, which had to verify a
 * `token_hash` server-side because a real magic link's PKCE exchange can
 * only ever be driven by the browser that requested it (see ADR 0005,
 * charge-points-server).
 *
 * Disabled outside development, whenever `SUPABASE_SERVICE_ROLE_KEY` isn't
 * set (which it never is in a deployed environment), and unless
 * `ENABLE_DEV_LOGIN=true` is explicitly set. The extra opt-in flag means a
 * misconfigured non-production deployment that happens to have the
 * service-role key set (e.g. a preview/staging environment) still can't
 * mint a code for an arbitrary email — a second, deliberate flag has to be
 * set too, so this can't activate by accident outside a developer's
 * machine.
 */
export async function GET(request: NextRequest) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_DEV_LOGIN !== "true" ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });

  if (error || !data?.properties?.email_otp) {
    return NextResponse.json(
      { error: error?.message ?? "Could not generate a code" },
      { status: 400 },
    );
  }

  return NextResponse.json({ code: data.properties.email_otp });
}

import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Local-dev-only shortcut around the OTP email: returns the code
 * (`properties.email_otp` from the admin API), which `DevLoginShortcut` passes
 * to `VerifyOtpForm` for the normal client-side `verifyOtp`.
 *
 * Disabled in production, without `SUPABASE_SERVICE_ROLE_KEY`, and unless
 * `ENABLE_DEV_LOGIN=true`, so a non-prod deployment that has the service-role
 * key still can't mint a code for an arbitrary email.
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

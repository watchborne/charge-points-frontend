"use client";

import { Callout, Button, Input, Label } from "@watchborne/electrons";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const RESEND_COOLDOWN_SECONDS = 30;
const OTP_CODE_LENGTH = 8;

interface VerifyOtpFormProps {
  email: string;
  onBack: () => void;
  // Dev-only: pre-fills the code from `/auth/dev-login` and submits it
  // immediately, so `DevLoginShortcut` still signs in in one click while
  // running through this component's real `verifyOtp` call instead of
  // bypassing it server-side. Never set outside `DevLoginShortcut`.
  initialCode?: string;
}

/**
 * Step 2 of sign-in: verifies the 8-digit code `LoginForm`'s `signInWithOtp`
 * call emailed to `email`. Unlike the magic-link code-exchange it replaces,
 * `verifyOtp` runs entirely client-side against the anon client — no redirect
 * through Supabase's hosted domain, no PKCE `code_verifier` cookie — so it
 * can't fail just because the user is on a different browser/device than the
 * one that requested the code (see ADR 0005 in charge-points-server).
 */
export function VerifyOtpForm({ email, onBack, initialCode }: VerifyOtpFormProps) {
  const t = useTranslations("");
  const locale = useLocale();
  const [code, setCode] = useState(initialCode ?? "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<"over_email_send_rate_limit" | "invalid" | "generic" | null>(
    null,
  );
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const verify = async (token: string) => {
    setIsVerifying(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (verifyError) {
      // Supabase error messages aren't localized; log for diagnostics and show
      // our own translated copy to the user instead of the raw message.
      console.error("verifyOtp failed:", verifyError.message);
      setIsVerifying(false);
      setError(verifyError.code === "otp_expired" ? "invalid" : "generic");
      return;
    }

    // Full-page navigation, not a client-side router push: same reasoning as
    // LogoutButton (app/auth/components/LogoutButton.tsx) — components elsewhere
    // resolve session state once on mount, so a hard reload is what reliably
    // picks up the session verifyOtp just created.
    window.location.assign("/app/dashboard");
  };

  useEffect(() => {
    // Only ever set by DevLoginShortcut with a fresh code for a freshly
    // mounted form, so firing once on mount (rather than tracking initialCode
    // as a dependency) is exactly the intended one-shot auto-submit.
    if (initialCode) void verify(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await verify(code);
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);

    const supabase = createClient();
    // Same call LoginForm makes to send the first code — shouldCreateUser stays
    // false for the same reason (an unknown email must not be able to fish for
    // a code), and locale keeps the resent email in the user's language.
    const { error: resendError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, data: { locale } },
    });

    setIsResending(false);

    if (resendError) {
      console.error("resend signInWithOtp failed:", resendError.message);
      setError(
        resendError.code === "over_email_send_rate_limit"
          ? "over_email_send_rate_limit"
          : "generic",
      );
      return;
    }

    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("loginPage.otp.description", { email })}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp-code">{t("loginPage.otp.codeLabel")}</Label>
          <Input
            id="otp-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={OTP_CODE_LENGTH}
            placeholder={t("loginPage.otp.codePlaceholder")}
            required
            disabled={isVerifying}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_CODE_LENGTH))}
          />
        </div>

        {error && (
          <Callout
            variant="error"
            description={
              error === "invalid"
                ? t("loginPage.otp.error.invalid")
                : t("loginPage.otp.error.generic")
            }
          />
        )}

        <Button type="submit" className="w-full" disabled={isVerifying} size="lg">
          {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("loginPage.otp.submit")}
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("loginPage.otp.changeEmail")}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || cooldown > 0}
          className="font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {cooldown > 0
            ? t("loginPage.otp.resendCooldown", { seconds: cooldown })
            : t("loginPage.otp.resend")}
        </button>
      </div>
    </div>
  );
}

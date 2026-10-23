"use client";

import { Callout, Button, Input, Label } from "@watchborne/electrons";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

const RESEND_COOLDOWN_SECONDS = 30;
const OTP_CODE_LENGTH = 8;

interface VerifyOtpFormProps {
  email: string;
  onBack: () => void;
  // Dev only (`DevLoginShortcut`): pre-fills the code and auto-submits.
  initialCode?: string;
}

/**
 * Step 2 of sign-in: verifies the code `LoginForm` emailed, client-side with
 * the anon client (no redirect, no PKCE cookie), so it works from any
 * browser or device.
 */
export function VerifyOtpForm({ email, onBack, initialCode }: VerifyOtpFormProps) {
  const t = useTranslations("");
  const locale = useLocale();
  const router = useRouter();
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
      // Supabase messages aren't localized: log the raw one, show ours.
      console.error("verifyOtp failed:", verifyError.message);
      setIsVerifying(false);
      setError(verifyError.code === "otp_expired" ? "invalid" : "generic");
      return;
    }

    router.push("/app/dashboard");
  };

  useEffect(() => {
    // One-shot auto-submit on mount for DevLoginShortcut's fresh code.
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
    // As in LoginForm: shouldCreateUser stays false, locale keeps the resent
    // email in the user's language.
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

        <Button type="submit" className="w-full" loading={isVerifying} size="lg">
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

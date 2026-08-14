"use client";

import { Callout, Button, Input, Label } from "@watchborne/electrons";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

interface LoginFormProps {
  onFormSubmitted: (email: string) => void;
}

export function LoginForm({ onFormSubmitted }: LoginFormProps) {
  const t = useTranslations("");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<"unknown-user" | "pending" | "generic" | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Gate on access_requests.status (ADR 0006) before signInWithOtp below:
    // an approved email has its Supabase user ensured as a side effect of
    // this call, so it's never in the "otp_disabled" state signInWithOtp
    // would report; pending/never-applied/rejected is turned back here with copy that says why.
    const access = await api.AccessRequests.checkLoginAccess(email).catch(() => null);
    if (access && !access.allowed) {
      setIsLoading(false);
      setError(access.code === "ACCESS_PENDING" ? "pending" : "unknown-user");
      return;
    }

    const supabase = createClient();
    // shouldCreateUser: false is defense in depth — the gate above actually
    // decides who reaches this call. No emailRedirectTo: the "Magic Link"
    // template now renders {{ .Token }}, a 6-digit code typed into
    // VerifyOtpForm — no link to redirect from anymore (ADR 0005).
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        // Read by the email template as {{ .Data.locale }} to send the email
        // in the user's current language.
        data: { locale },
      },
    });

    setIsLoading(false);

    if (signInError) {
      // Supabase error messages aren't localized; log for diagnostics, show
      // our own translated copy instead of the raw message.
      console.error("signInWithOtp failed:", signInError.message);
      setError(signInError.code === "otp_disabled" ? "unknown-user" : "generic");
      return;
    }

    onFormSubmitted(email);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("loginPage.form.email")}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t("loginPage.form.emailPlaceholder")}
          required
          autoComplete="email"
          disabled={isLoading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {error && (
        <Callout
          variant={error === "pending" ? "info" : "error"}
          description={
            error === "unknown-user"
              ? t("loginPage.sendCode.unknownUser")
              : error === "pending"
                ? t("loginPage.sendCode.pending")
                : t("loginPage.sendCode.error")
          }
        />
      )}

      <Button type="submit" className="w-full" disabled={isLoading} size="lg">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("loginPage.form.submit")}
      </Button>
    </form>
  );
}

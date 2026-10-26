"use client";

import { Callout, Button, Input, Label } from "@watchborne/electrons";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { api } from "@/lib/api";
import { isReportableError, reportError } from "@/lib/report-error";
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

    // Gate on the access request before signInWithOtp: an approved email has
    // its Supabase user ensured by this call; pending, unknown or rejected
    // emails are turned back here with an explanation.
    // A failed check does not block sign-in: shouldCreateUser: false below still
    // admits invited users only.
    const access = await api.AccessRequests.checkLoginAccess(email).catch((checkError) => {
      if (isReportableError(checkError)) reportError(checkError, "LoginForm.checkLoginAccess");
      return null;
    });
    if (access && !access.allowed) {
      setIsLoading(false);
      setError(access.code === "ACCESS_PENDING" ? "pending" : "unknown-user");
      return;
    }

    const supabase = createClient();
    // shouldCreateUser: false is defense in depth: the gate above decides. No
    // emailRedirectTo: the email carries a code, not a link.
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        // Used by the email template ({{ .Data.locale }}).
        data: { locale },
      },
    });

    setIsLoading(false);

    if (signInError) {
      // otp_disabled is an unknown email, an answer; anything else is a failure.
      if (signInError.code === "otp_disabled") {
        setError("unknown-user");
      } else {
        reportError(signInError, "LoginForm.signInWithOtp");
        setError("generic");
      }
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

      <Button type="submit" className="w-full" loading={isLoading} size="lg">
        {t("loginPage.form.submit")}
      </Button>
    </form>
  );
}

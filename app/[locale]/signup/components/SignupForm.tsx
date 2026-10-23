"use client";

import { Callout, Button, Input, Label } from "@watchborne/electrons";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { api } from "@/lib/api";
import { isReportableError, reportError } from "@/lib/report-error";

interface SignupFormProps {
  onFormSubmitted: (email: string) => void;
}

export function SignupForm({ onFormSubmitted }: SignupFormProps) {
  const t = useTranslations("");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    // Signing up only records an access request (public route); access is
    // granted by an admin inviting the email in Supabase. The backend is
    // idempotent on email, so a repeat doesn't reveal who already applied.
    try {
      await api.AccessRequests.requestAccess({ email, locale });
      onFormSubmitted(email);
    } catch (requestError) {
      // Surface our own translated copy rather than the raw transport error.
      if (isReportableError(requestError)) reportError(requestError, "SignupForm.requestAccess");
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("signupPage.form.email")}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t("signupPage.form.emailPlaceholder")}
          required
          autoComplete="email"
          disabled={isLoading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {error && <Callout variant="error" description={t("signupPage.confirmation.error")} />}

      <Button type="submit" className="w-full" loading={isLoading} size="lg">
        {t("signupPage.form.submit")}
      </Button>
    </form>
  );
}

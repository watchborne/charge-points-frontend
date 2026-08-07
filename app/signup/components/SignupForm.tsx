"use client";

import { Callout, Button, Input, Label } from "@watchborne/electrons";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { api } from "@/lib/api";

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

    // Alpha access is gated: signing up does NOT create an auth user, it only
    // records a request via the backend (`POST /api/access-requests`, a public
    // route). Access is granted out-of-band by inviting the email from the
    // Supabase dashboard — that invite is what creates the user and lets
    // `/login`'s `shouldCreateUser: false` flow work. `locale` is captured so the
    // follow-up can be written in the requester's language. The backend is
    // idempotent on the email, so a repeat request succeeds without leaking who
    // has already applied.
    try {
      await api.AccessRequests.requestAccess({ email, locale });
      onFormSubmitted(email);
    } catch (requestError) {
      // Surface our own translated copy rather than the raw transport error.
      console.error("access request failed:", requestError);
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

      <Button type="submit" className="w-full" disabled={isLoading} size="lg">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("signupPage.form.submit")}
      </Button>
    </form>
  );
}

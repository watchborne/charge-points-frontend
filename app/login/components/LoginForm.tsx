"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Callout } from "@/app/app/components/common/Callout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface LoginFormProps {
  onFormSubmitted: (email: string) => void;
}

export function LoginForm({ onFormSubmitted }: LoginFormProps) {
  const t = useTranslations("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<"unknown-user" | "generic" | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    // shouldCreateUser: false makes Supabase verify the email belongs to an
    // existing user before sending anything — unknown emails get an
    // "otp_disabled" error instead of silently creating an account and
    // sending a link.
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (signInError) {
      // Supabase error messages aren't localized; log for diagnostics and show
      // our own translated copy to the user instead of the raw message.
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
          variant="error"
          description={
            error === "unknown-user"
              ? t("loginPage.magicLink.unknownUser")
              : t("loginPage.magicLink.error")
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

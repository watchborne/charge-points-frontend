"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Callout } from "@/app/app/components/common/Callout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface SignupFormProps {
  onFormSubmitted: (email: string) => void;
}

export function SignupForm({ onFormSubmitted }: SignupFormProps) {
  const t = useTranslations("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    const supabase = createClient();
    // Sign-in is passwordless (magic link), so this password is never used again —
    // it only satisfies the email/password signUp API, which is what triggers
    // Supabase's "Confirm signup" email instead of the magic-link template.
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: crypto.randomUUID(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (signUpError) {
      // Supabase error messages aren't localized; log for diagnostics and show
      // our own translated copy to the user instead of the raw message.
      console.error("signUp failed:", signUpError.message);
      setError(true);
      return;
    }

    onFormSubmitted(email);
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

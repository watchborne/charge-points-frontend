"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface SignupFormProps {
  labels: {
    email: string;
    emailPlaceholder: string;
    submit: string;
    sentTitle: string;
    sentDescription: string;
    error: string;
  };
}

export function SignupForm({ labels }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-lg border bg-muted/50 p-6 text-center space-y-2">
        <p className="font-medium">{labels.sentTitle}</p>
        <p className="text-sm text-muted-foreground">{labels.sentDescription}</p>
        <p className="text-sm font-medium">{email}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{labels.email}</Label>
        <Input
          id="email"
          type="email"
          placeholder={labels.emailPlaceholder}
          required
          autoComplete="email"
          disabled={isLoading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{labels.error}</p>}

      <Button type="submit" className="w-full" disabled={isLoading} size="lg">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {labels.submit}
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface LoginFormProps {
  labels: {
    email: string;
    emailPlaceholder: string;
    submit: string;
    sentTitle: string;
    sentDescription: string;
    error: string;
  };
}

export function LoginForm({ labels }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (signInError) {
      // Supabase error messages aren't localized; log for diagnostics and show
      // our own translated copy to the user instead of the raw message.
      console.error("signInWithOtp failed:", signInError.message);
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

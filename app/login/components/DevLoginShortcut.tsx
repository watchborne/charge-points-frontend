"use client";

import { Button, Input } from "@watchborne/electrons";
import { useState } from "react";

import { VerifyOtpForm } from "./VerifyOtpForm";

/**
 * Only rendered by `LoginPage` when `NODE_ENV !== "production"` (see
 * `app/login/page.tsx`). Fetches a real OTP code for the given email from
 * `/auth/dev-login` — itself gated the same way plus behind
 * `ENABLE_DEV_LOGIN=true` and `SUPABASE_SERVICE_ROLE_KEY`; this component is
 * a convenience shortcut, not the security boundary — then hands it to
 * `VerifyOtpForm` as `initialCode`, which auto-submits it. That runs the
 * exact same client-side `verifyOtp` call a real user's browser would,
 * instead of bypassing it.
 */
export function DevLoginShortcut() {
  const [email, setEmail] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsFetching(true);
    setError(null);

    const response = await fetch(`/auth/dev-login?email=${encodeURIComponent(email)}`);
    const data = await response.json();

    setIsFetching(false);

    if (!response.ok) {
      setError(data.error ?? "Could not fetch a code");
      return;
    }

    setCode(data.code);
  };

  if (code) {
    return <VerifyOtpForm email={email} initialCode={code} onBack={() => setCode(null)} />;
  }

  return (
    <div className="rounded-lg border border-dashed p-4 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Dev only — signs in instantly, skips the OTP email
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <Input
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          className="text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" variant="outline" size="sm" disabled={isFetching}>
          Sign in
        </Button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

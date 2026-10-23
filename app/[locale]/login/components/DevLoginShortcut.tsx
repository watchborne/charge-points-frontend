"use client";

import { Button, Input } from "@watchborne/electrons";
import { useState } from "react";

import { VerifyOtpForm } from "./VerifyOtpForm";

/**
 * Rendered by `LoginPage` outside production. Fetches a real OTP code from
 * `/auth/dev-login` (which enforces the actual gating) and passes it to
 * `VerifyOtpForm` as `initialCode`, which submits it through the normal
 * `verifyOtp` call.
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

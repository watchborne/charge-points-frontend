"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

function AuthErrorCalloutContent() {
  const t = useTranslations("loginPage.authError");
  const searchParams = useSearchParams();

  const errorCode = searchParams.get("error_code");

  if (!errorCode) {
    return null;
  }

  const description = errorCode === "otp_expired" ? t("otpExpired") : t("generic");

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-sm">{description}</p>
    </div>
  );
}

export function AuthErrorCallout() {
  return (
    <Suspense fallback={null}>
      <AuthErrorCalloutContent />
    </Suspense>
  );
}

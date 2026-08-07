"use client";

import { Callout } from "@watchborne/electrons";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

function AuthErrorCalloutContent() {
  const t = useTranslations("");
  const searchParams = useSearchParams();

  const errorCode = searchParams.get("error_code");

  if (!errorCode) return null;

  const description =
    errorCode === "otp_expired"
      ? t("loginPage.authError.otpExpired")
      : errorCode === "exchange_failed"
        ? t("loginPage.authError.exchangeFailed")
        : t("loginPage.authError.generic");

  return <Callout variant="error" description={description} />;
}

export function AuthErrorCallout() {
  return (
    <Suspense fallback={null}>
      <AuthErrorCalloutContent />
    </Suspense>
  );
}

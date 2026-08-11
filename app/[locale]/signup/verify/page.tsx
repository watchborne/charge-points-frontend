"use client";

import { Button, Callout, Loader } from "@watchborne/electrons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";

import { api } from "@/lib/api";

type Status = "verifying" | "success" | "invalid" | "expired";

function VerifyEmailStatus() {
  const t = useTranslations("");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "verifying" : "invalid");

  useEffect(() => {
    if (!token) return;

    api.AccessRequests.verifyEmail(token)
      .then((result) => {
        setStatus(
          result.verified ? "success" : result.code === "EXPIRED_TOKEN" ? "expired" : "invalid",
        );
      })
      .catch(() => setStatus("invalid"));
    // Only re-run if the token itself changes — verifyEmail is idempotent
    // server-side, but there is no reason to re-issue the call otherwise.
  }, [token]);

  if (status === "verifying") {
    return <Loader label={t("signupPage.verify.verifying")} />;
  }

  if (status === "success") {
    return (
      <Callout
        variant="success"
        title={t("signupPage.verify.successTitle")}
        description={t("signupPage.verify.successDescription")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Callout
        variant="error"
        title={
          status === "expired"
            ? t("signupPage.verify.expiredTitle")
            : t("signupPage.verify.invalidTitle")
        }
        description={
          status === "expired"
            ? t("signupPage.verify.expiredDescription")
            : t("signupPage.verify.invalidDescription")
        }
      />
      <Button asChild variant="secondary" className="w-fit">
        <Link href="/signup">{t("signupPage.verify.backToSignup")}</Link>
      </Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex items-center justify-center min-h-screen lg:min-h-0 p-8 bg-background">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <Suspense>
          <VerifyEmailStatus />
        </Suspense>
      </div>
    </div>
  );
}

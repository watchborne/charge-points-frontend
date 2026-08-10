"use client";

import { Badge, Callout } from "@watchborne/electrons";
import { PlugZap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/navigation";

import { SignupForm } from "./components/SignupForm";

export default function SignupPage() {
  const t = useTranslations("");

  const features = Object.entries(t.raw("signupPage.branding.features") as Record<string, string>);
  const [userEmail, setUserEmail] = useState<string>();

  return (
    <>
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-10">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
        >
          {t("appName")}
        </Link>

        <div>
          <PlugZap className="h-10 w-10 mb-8 text-charge" />

          <p className="text-3xl font-bold leading-snug">{t("signupPage.branding.tagline")}</p>

          <ul className="mt-8 space-y-3">
            {features.map(([key, feature]) => (
              <li key={key} className="flex items-center gap-3 text-sm opacity-80">
                <div className="h-1.5 w-1.5 rounded-full bg-charge shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs opacity-40">
          © {new Date().getFullYear()} {t("appName")}
        </p>
      </div>

      <div className="flex items-center justify-center min-h-screen lg:min-h-0 p-8 bg-background">
        <div className="w-full max-w-sm flex flex-col gap-4">
          {/* Mobile brand */}
          <Link
            href="/"
            className="inline-block text-lg font-semibold tracking-tight mb-8 lg:hidden"
          >
            {t("appName")}
          </Link>

          <div className="flex flex-col gap-2">
            <Badge variant="secondary" className="w-fit">
              {t("signupPage.alphaBadge")}
            </Badge>

            <h1 className="text-2xl font-bold tracking-tight">{t("signupPage.title")}</h1>

            <p className="mt-2 text-sm text-muted-foreground">{t("signupPage.subtitle")}</p>
          </div>

          {!userEmail ? (
            <SignupForm onFormSubmitted={(email) => setUserEmail(email)} />
          ) : (
            <Callout variant="success" title={t("signupPage.confirmation.calloutTitle")}>
              <div className="block text-sm">
                {t.rich("signupPage.confirmation.calloutDescription", {
                  link: () => (
                    <a className="font-bold" href={`mailto:${userEmail}`}>
                      {userEmail}
                    </a>
                  ),
                })}
              </div>
            </Callout>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {t("signupPage.hasAccount.text")}{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("signupPage.hasAccount.link")}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

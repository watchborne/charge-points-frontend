"use client";

import { PlugZap } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";

import { AuthErrorCallout } from "./components/AuthErrorCallout";
import { DevLoginShortcut } from "./components/DevLoginShortcut";
import { LoginForm } from "./components/LoginForm";
import { Callout } from "../app/components/common/Callout";

export default function LoginPage() {
  const t = useTranslations("");
  const features = t.raw("loginPage.branding.features") as Record<string, string>;
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

          <p className="text-3xl font-bold leading-snug">{t("loginPage.branding.tagline")}</p>

          <ul className="mt-8 space-y-3">
            {Object.entries(features).map(([key, feature]) => (
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
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <Link
            href="/"
            className="inline-block text-lg font-semibold tracking-tight mb-8 lg:hidden"
          >
            {t("appName")}
          </Link>

          <div className="mb-8">
            <Badge variant="secondary" className="mb-4">
              {t("loginPage.alphaBadge")}
            </Badge>

            <h1 className="text-2xl font-bold tracking-tight">{t("loginPage.title")}</h1>

            <p className="mt-2 text-sm text-muted-foreground">{t("loginPage.subtitle")}</p>
          </div>

          <AuthErrorCallout />

          {!userEmail ? (
            <LoginForm onFormSubmitted={(email) => setUserEmail(email)} />
          ) : (
            <Callout variant="success" title={t("loginPage.magicLink.calloutTitle")}>
              <div className="block">
                {t.rich("loginPage.magicLink.calloutDescription", {
                  link: () => (
                    <a className="font-bold" href={`mailto:${userEmail}`}>
                      {userEmail}
                    </a>
                  ),
                })}
              </div>
            </Callout>
          )}

          {process.env.NODE_ENV !== "production" && <DevLoginShortcut />}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("loginPage.noAccount.text")}{" "}
            <Link
              href="/signup"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("loginPage.noAccount.link")}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

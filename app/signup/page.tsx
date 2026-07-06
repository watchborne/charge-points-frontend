import Link from "next/link";
import { useTranslations } from "next-intl";
import { PlugZap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SignupForm } from "./components/SignupForm";

export default function SignupPage() {
  const t = useTranslations("");

  const features = Object.entries(t.raw("signupPage.branding.features") as Record<string, string>);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-10">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
        >
          {t("appName")}
        </Link>

        <div>
          <PlugZap className="h-10 w-10 mb-8 opacity-70" />

          <p className="text-3xl font-bold leading-snug">{t("signupPage.branding.tagline")}</p>

          <ul className="mt-8 space-y-3">
            {features.map(([key, feature]) => (
              <li key={key} className="flex items-center gap-3 text-sm opacity-80">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs opacity-40">
          © {new Date().getFullYear()} {t("appName")}
        </p>
      </div>

      {/* Right panel — form */}
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
              {t("signupPage.alphaBadge")}
            </Badge>

            <h1 className="text-2xl font-bold tracking-tight">{t("signupPage.title")}</h1>

            <p className="mt-2 text-sm text-muted-foreground">{t("signupPage.subtitle")}</p>
          </div>

          <SignupForm
            labels={{
              email: t("signupPage.form.email"),
              emailPlaceholder: t("signupPage.form.emailPlaceholder"),
              submit: t("signupPage.form.submit"),
              sentTitle: t("signupPage.confirmation.sentTitle"),
              sentDescription: t("signupPage.confirmation.sentDescription"),
              error: t("signupPage.confirmation.error"),
            }}
          />

          <p className="mt-6 text-center text-sm text-muted-foreground">
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
    </div>
  );
}

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PlugZap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LoginForm } from "./components/LoginForm";

export default function LoginPage() {
  const t = useTranslations("loginPage");
  const tRoot = useTranslations("");

  const features = t.raw("branding.features") as string[];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-10">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
        >
          {tRoot("appName")}
        </Link>

        <div>
          <PlugZap className="h-10 w-10 mb-8 opacity-70" />

          <p className="text-3xl font-bold leading-snug">{t("branding.tagline")}</p>

          <ul className="mt-8 space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm opacity-80">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs opacity-40">
          © {new Date().getFullYear()} {tRoot("appName")}
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
            {tRoot("appName")}
          </Link>

          <div className="mb-8">
            <Badge variant="secondary" className="mb-4">
              {t("alphaBadge")}
            </Badge>

            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

            <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>

          <LoginForm
            labels={{
              email: t("form.email"),
              emailPlaceholder: t("form.emailPlaceholder"),
              submit: t("form.submit"),
              sentTitle: t("magicLink.sentTitle"),
              sentDescription: t("magicLink.sentDescription"),
              error: t("magicLink.error"),
            }}
          />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("noAccount.text")}{" "}
            <Link
              href="/contact"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("noAccount.link")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

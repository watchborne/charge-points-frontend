import { PlugZap, Zap } from "lucide-react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { NextIntlClientProvider, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  title: "Watchborne - Page introuvable",
  description: "This page could not be found",
};

const NotFoundContent = () => {
  const t = useTranslations("notFoundPage");
  const tRoot = useTranslations("");

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
        </div>

        <p className="text-xs opacity-40">
          © {new Date().getFullYear()} {tRoot("appName")}
        </p>
      </div>

      {/* Right panel — content */}
      <div className="flex items-center justify-center min-h-screen lg:min-h-0 p-8 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <Link
            href="/"
            className="inline-block text-lg font-semibold tracking-tight mb-8 lg:hidden"
          >
            {tRoot("appName")}
          </Link>

          <Badge variant="secondary" className="mb-4">
            {t("badge")}
          </Badge>

          <div className="flex items-center gap-3">
            <Zap className="h-10 w-10 text-muted-foreground shrink-0" />
            <h1 className="text-6xl font-bold tracking-tight">404</h1>
          </div>

          <h2 className="mt-4 text-2xl font-bold tracking-tight">{t("title")}</h2>

          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>

          <Button asChild className="mt-8 w-full">
            <Link href="/">{t("backHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function NotFound() {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <NextIntlClientProvider>
          <NotFoundContent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

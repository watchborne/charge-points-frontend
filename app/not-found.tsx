import { PlugZap } from "lucide-react";
import type { Metadata } from "next";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  title: "Watchborne - Page Not Found",
  description: "This page could not be found",
};

const NotFoundContent = () => {
  const t = useTranslations("notFoundPage");
  const tRoot = useTranslations("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-sm text-center">
        <Link
          href="/"
          className="inline-block text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
        >
          {tRoot("appName")}
        </Link>

        <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <PlugZap className="h-8 w-8 text-muted-foreground" />
        </div>

        <p className="mt-6 text-sm font-semibold tracking-widest text-muted-foreground">404</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight">{t("title")}</h1>

        <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>

        <Button asChild size="lg" className="mt-8">
          <Link href="/">{t("cta")}</Link>
        </Button>
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

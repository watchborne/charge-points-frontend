import { PlugZap } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export const NotFoundContent = () => {
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

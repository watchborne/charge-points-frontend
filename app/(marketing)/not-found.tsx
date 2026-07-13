import { Zap } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("notFoundPage");

  return (
    <main className="flex flex-col">
      <section className="container mx-auto px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-lg flex flex-col items-center text-center">
          <Badge variant="secondary" className="mb-4">
            {t("badge")}
          </Badge>

          <div className="flex items-center gap-3">
            <Zap className="h-10 w-10 text-muted-foreground shrink-0" />
            <h1 className="text-6xl font-bold tracking-tight">404</h1>
          </div>

          <h2 className="mt-4 text-2xl font-bold tracking-tight">{t("title")}</h2>

          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>

          <Button asChild className="mt-8">
            <Link href="/">{t("backHome")}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

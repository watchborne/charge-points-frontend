import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function Navbar() {
  const t = useTranslations("");

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {t("appName")}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
            {t("layout.navbar.navigation.pricing")}
          </Link>

          <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
            {t("layout.navbar.navigation.contact")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">{t("layout.navbar.actions.login")}</Link>
          </Button>

          <Button>{t("layout.navbar.actions.requestAlphaAccess")}</Button>
        </div>
      </div>
    </header>
  );
}

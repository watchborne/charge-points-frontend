"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
  const t = useTranslations("");
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    checkUser();
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center px-6 gap-6">
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

        <div className="flex items-center gap-3 ml-auto">
          {!isLoading && user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              {t("layout.navbar.actions.logout")}
            </Button>
          ) : !isLoading ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">{t("layout.navbar.actions.login")}</Link>
              </Button>

              <Button>{t("layout.navbar.actions.requestAlphaAccess")}</Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

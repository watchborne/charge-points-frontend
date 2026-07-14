"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { LogoutButton } from "@/app/auth/components/LogoutButton";
import { Navbar as LayoutNavbar, NavbarLink } from "@/app/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
  const t = useTranslations("");

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const links = [
    { key: "pricing", label: t("layout.navbar.navigation.pricing"), url: "/pricing" },
    { key: "contact", label: t("layout.navbar.navigation.contact"), url: "/contact" },
  ] satisfies NavbarLink[];

  return (
    <LayoutNavbar links={links}>
      {!isLoading && user ? (
        <>
          <Button variant="info" size="sm" asChild>
            <Link href="/app/dashboard">{t("layout.navbar.actions.dashboard")}</Link>
          </Button>

          <LogoutButton />
        </>
      ) : !isLoading ? (
        <>
          <Button variant="ghost" asChild>
            <Link href="/login">{t("layout.navbar.actions.login")}</Link>
          </Button>

          <Button variant="charge" asChild>
            <Link href="/signup">{t("layout.navbar.actions.requestAlphaAccess")}</Link>
          </Button>
        </>
      ) : null}
    </LayoutNavbar>
  );
}

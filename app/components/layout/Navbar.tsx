import classNames from "classnames";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { PropsWithChildren, useState } from "react";
import { UrlObject } from "url";

import { Button } from "@/components/ui/button";

export type NavbarLink = { key: string; label: string; url: string | UrlObject };

type Props = {
  links: NavbarLink[];
} & PropsWithChildren;

export function Navbar({ links, children }: Props) {
  const t = useTranslations("");
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActiveLink = (url: NavbarLink["url"]) => pathname.startsWith(url.toString());

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center px-4 gap-6 sm:px-6">
        <Link
          href={`/${pathname.startsWith("/app/") ? "app/dashboard" : ""}`}
          className="text-lg font-semibold tracking-tight"
        >
          {t("appName")}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map(({ key, label, url }) => (
            <Link
              key={key}
              href={url}
              className={classNames(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                isActiveLink(url)
                  ? "bg-charge-soft text-charge-strong"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {children && <div className="hidden items-center gap-3 ml-auto md:flex">{children}</div>}

        <Button
          variant="ghost"
          size="icon"
          className="ml-auto md:hidden"
          aria-label={t("layout.navbar.actions.menu")}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t px-4 py-4 sm:px-6 md:hidden">
          <nav className="flex flex-col gap-4">
            {links.map(({ key, label, url }) => (
              <Link
                key={key}
                href={url}
                onClick={closeMobileMenu}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </nav>

          {children && <div className="mt-4 flex flex-col gap-2">{children}</div>}
        </div>
      ) : null}
    </header>
  );
}

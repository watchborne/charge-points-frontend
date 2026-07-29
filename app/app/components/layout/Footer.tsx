import Link from "next/link";
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/app/components/layout/LocaleSwitcher";

export const Footer = () => {
  const t = useTranslations("");

  return (
    <footer className="border-t">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <span>{t("layout.footer.copyright", { year: new Date().getFullYear() })}</span>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/contact" className="hover:text-foreground">
            {t("layout.footer.sections.company.links.contact")}
          </Link>

          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  );
};

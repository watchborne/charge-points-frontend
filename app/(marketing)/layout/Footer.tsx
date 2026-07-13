import Link from "next/link";
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "./LocaleSwitcher";

export function Footer() {
  const t = useTranslations("");

  return (
    <footer className="border-t">
      <div className="container mx-auto px-6 pt-10 gap-6 flex flex-col content-stretch">
        <div className="grid gap-16 md:grid-cols-4">
          <div>
            <h3 className="font-semibold">{t("appName")}</h3>

            <p className="mt-3 text-sm text-muted-foreground">{t("layout.footer.description")}</p>
          </div>

          <div>
            <h4 className="mb-3 font-medium">{t("layout.footer.sections.product.title")}</h4>

            <div className="space-y-2 text-sm">
              <Link href="/features" className="block text-muted-foreground hover:text-foreground">
                {t("layout.footer.sections.product.links.features")}
              </Link>

              <Link href="/pricing" className="block text-muted-foreground hover:text-foreground">
                {t("layout.footer.sections.product.links.pricing")}
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-medium">{t("layout.footer.sections.company.title")}</h4>

            <div className="space-y-2 text-sm">
              <Link href="/about" className="block text-muted-foreground hover:text-foreground">
                {t("layout.footer.sections.company.links.about")}
              </Link>

              <Link href="/contact" className="block text-muted-foreground hover:text-foreground">
                {t("layout.footer.sections.company.links.contact")}
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-medium">{t("layout.footer.sections.legal.title")}</h4>

            <div className="space-y-2 text-sm">
              <Link href="/privacy" className="block text-muted-foreground hover:text-foreground">
                {t("layout.footer.sections.legal.links.privacy", {
                  year: new Date().getFullYear(),
                })}
              </Link>

              <Link href="/terms" className="block text-muted-foreground hover:text-foreground">
                {t("layout.footer.sections.legal.links.terms")}
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-charge-200 bg-charge-50 p-4 text-sm text-charge-700">
          <h4 className="mb-2 font-medium">{t("layout.footer.warning.title")}</h4>
          <p>{t("layout.footer.warning.description")}</p>

          <small className="mt-2 block text-xs font-bold">
            {t("layout.footer.warning.pricing")}
          </small>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t py-6 text-sm text-muted-foreground">
          <span>{t("layout.footer.copyright", { year: new Date().getFullYear() })}</span>

          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  );
}

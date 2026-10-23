"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@watchborne/electrons";
import { useLocale, useTranslations } from "next-intl";

import { isLocale, locales } from "@/i18n/locale";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const t = useTranslations("");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(nextLocale: string) {
    if (!isLocale(nextLocale)) return;

    // Locale-aware pathname/router (i18n/navigation.ts): same page, new locale.
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger aria-label={t("layout.footer.language.label")} className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((value) => (
          <SelectItem key={value} value={value}>
            {t(`layout.footer.language.${value}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isLocale, locales } from "@/i18n/locale";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const t = useTranslations("");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(nextLocale: string) {
    if (!isLocale(nextLocale)) return;

    // usePathname()/router here are the locale-aware versions from
    // i18n/navigation.ts: `pathname` already has any locale prefix
    // stripped, and passing `locale` re-navigates to the same page under
    // the new locale's URL (prefixed or not — see i18n/routing.ts).
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

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isLocale, locales, withLocaleParam } from "@/i18n/locale";

export function LocaleSwitcher() {
  const t = useTranslations("layout.footer.language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(nextLocale: string) {
    if (!isLocale(nextLocale)) return;

    router.replace(withLocaleParam(pathname, searchParams.toString(), nextLocale));
    router.refresh();
  }

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger aria-label={t("label")} className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((value) => (
          <SelectItem key={value} value={value}>
            {t(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

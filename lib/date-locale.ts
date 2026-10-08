import type { Locale } from "date-fns";
import { enGB, fr } from "date-fns/locale";
import { useLocale } from "next-intl";

const DATE_FNS_LOCALES: Record<string, Locale> = { fr, en: enGB };

/** Maps an app locale ("fr" | "en") to its date-fns locale (fr by default). */
export const getDateFnsLocale = (locale: string): Locale => DATE_FNS_LOCALES[locale] ?? fr;

/** date-fns locale matching the active next-intl locale. */
export const useDateFnsLocale = (): Locale => getDateFnsLocale(useLocale());

import { format, formatDistanceToNow } from "date-fns";
import type { Locale } from "date-fns";
import { enGB, fr } from "date-fns/locale";
import { useLocale } from "next-intl";

type DateInput = Date | string | number;

const DATE_FNS_LOCALES: Record<string, Locale> = { fr, en: enGB };

const resolveLocale = (locale: string): Locale => DATE_FNS_LOCALES[locale] ?? fr;

/**
 * Locale-aware date helpers for the active next-intl locale. Components call
 * these instead of importing a date library, so the underlying library stays
 * an implementation detail of this module. Everything is rendered in the
 * browser's local time.
 */
export const useDateFormat = () => {
  const locale = resolveLocale(useLocale());

  return {
    /** "il y a 3 heures" / "3 hours ago". */
    formatRelative: (date: DateInput) =>
      formatDistanceToNow(new Date(date), { addSuffix: true, locale }),
    /** "08/10/2026 14:05", or "08/10/2026 14:05:09" with `withSeconds`. */
    formatDateTime: (date: DateInput, { withSeconds = false }: { withSeconds?: boolean } = {}) =>
      format(new Date(date), withSeconds ? "dd/MM/yyyy HH:mm:ss" : "dd/MM/yyyy HH:mm"),
    /** "08 octobre 2026". */
    formatDate: (date: DateInput) => format(new Date(date), "dd MMMM yyyy", { locale }),
    /** "14:05". */
    formatTime: (date: DateInput) => format(new Date(date), "HH:mm", { locale }),
  };
};

/**
 * The calendar widget (react-day-picker) takes a date-fns `Locale` object
 * directly; this is the only place that leaks the library, scoped to it.
 */
export const useCalendarLocale = (): Locale => resolveLocale(useLocale());

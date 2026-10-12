import { formatDistanceToNow } from "date-fns";
import type { Locale } from "date-fns";
import { enGB, fr } from "date-fns/locale";
import { useLocale } from "next-intl";
import { useMemo } from "react";

type DateInput = Date | string | number;

const DATE_FNS_LOCALES: Record<string, Locale> = { fr, en: enGB };

const resolveLocale = (locale: string): Locale => DATE_FNS_LOCALES[locale] ?? fr;

/** The BCP 47 tag `Intl` formats with; `fr` is the app's default, so it is the fallback. */
const resolveIntlLocale = (locale: string): string => (locale === "en" ? "en" : "fr");

const NUMERIC_DATE = { year: "numeric", month: "2-digit", day: "2-digit" } as const;
const HOUR_MINUTE = { hour: "2-digit", minute: "2-digit" } as const;

/**
 * Locale-aware date helpers for the active next-intl locale. Components call
 * these instead of reaching for `Intl`, `date-fns` or next-intl's `useFormatter`,
 * so a date reads the same wherever it shows up and the underlying library stays
 * an implementation detail of this module.
 *
 * Output follows the *language* of the UI, not a fixed pattern: French renders
 * `08/10/2026 14:05`, English `10/08/2026, 02:05 PM` (the way next-intl itself
 * formats `en`). Everything is rendered in the browser's local time.
 */
export const useDateFormat = () => {
  const activeLocale = useLocale();
  const intlLocale = resolveIntlLocale(activeLocale);
  const dateFnsLocale = resolveLocale(activeLocale);

  return useMemo(() => {
    const formatter = (options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(intlLocale, options);

    const dateTime = formatter({ ...NUMERIC_DATE, ...HOUR_MINUTE });
    const dateTimeWithSeconds = formatter({ ...NUMERIC_DATE, ...HOUR_MINUTE, second: "2-digit" });
    const numericDate = formatter(NUMERIC_DATE);
    const longDate = formatter({ day: "2-digit", month: "long", year: "numeric" });
    const time = formatter(HOUR_MINUTE);
    const shortDateTime = formatter({ day: "2-digit", month: "2-digit", ...HOUR_MINUTE });
    const dayMonth = formatter({ day: "2-digit", month: "2-digit" });

    return {
      /** "il y a 3 heures" / "3 hours ago". */
      formatRelative: (date: DateInput) =>
        formatDistanceToNow(new Date(date), { addSuffix: true, locale: dateFnsLocale }),
      /** "08/10/2026 14:05" (fr) / "10/08/2026, 02:05 PM" (en); `withSeconds` adds the seconds. */
      formatDateTime: (date: DateInput, { withSeconds = false }: { withSeconds?: boolean } = {}) =>
        (withSeconds ? dateTimeWithSeconds : dateTime).format(new Date(date)),
      /** "08/10/2026" (fr) / "10/08/2026" (en). */
      formatDateNumeric: (date: DateInput) => numericDate.format(new Date(date)),
      /** "08 octobre 2026" (fr) / "October 08, 2026" (en). */
      formatDate: (date: DateInput) => longDate.format(new Date(date)),
      /** "14:05" (fr) / "02:05 PM" (en). */
      formatTime: (date: DateInput) => time.format(new Date(date)),
      /** "08/10 14:05" (fr) / "10/08, 02:05 PM" (en) — compact, for tooltips where the year is implied. */
      formatShortDateTime: (date: DateInput) => shortDateTime.format(new Date(date)),
      /** "08/10" (fr) / "10/08" (en) — day and month only, e.g. a chart tick spanning several days. */
      formatDayMonth: (date: DateInput) => dayMonth.format(new Date(date)),
    };
  }, [intlLocale, dateFnsLocale]);
};

/**
 * The calendar widget (react-day-picker) takes a date-fns `Locale` object
 * directly; this is the only place that leaks the library, scoped to it.
 */
export const useCalendarLocale = (): Locale => resolveLocale(useLocale());

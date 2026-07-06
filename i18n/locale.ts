// Pure locale helpers with no next-intl/next-headers imports, so they stay safe
// to use from the edge middleware runtime.

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
export const LOCALE_QUERY_PARAM = "lang";

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function withLocaleParam(pathname: string, currentSearch: string, locale: Locale): string {
  const params = new URLSearchParams(currentSearch);
  params.set(LOCALE_QUERY_PARAM, locale);
  return `${pathname}?${params.toString()}`;
}

// TLD-based locale for hosts that don't carry an explicit NEXT_LOCALE cookie
// yet (e.g. a visitor's first request): watch-borne.fr -> fr, watch-borne.com -> en.
// Falls back to `defaultLocale` for any other host (localhost, netlify preview, ...).
export function localeForHost(host: string): Locale {
  if (host.endsWith(".fr")) return "fr";
  if (host.endsWith(".com")) return "en";
  return defaultLocale;
}

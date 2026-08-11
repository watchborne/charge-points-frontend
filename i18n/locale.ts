// Pure locale helpers with no next-intl/next-headers imports, so they stay safe
// to use from the edge middleware runtime.

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

// Matches next-intl's own default cookie name (routing.ts doesn't override
// it) — kept as an explicit constant since route handlers outside the
// `[locale]` segment (auth/callback, auth/dev-login) need to read it directly
// to build a locale-prefixed redirect target themselves.
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

// `defaultLocale` (fr) is served unprefixed (localePrefix: "as-needed" in
// i18n/routing.ts), so only non-default locales need a `/en`-style prefix.
export function localizedPath(path: string, locale: Locale): string {
  return locale === defaultLocale ? path : `/${locale}${path}`;
}

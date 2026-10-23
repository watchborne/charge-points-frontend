// No next-intl/next imports, so these stay usable from the edge runtime.

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

// next-intl's default cookie name (routing.ts doesn't override it).
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

// The default locale is unprefixed (localePrefix: "as-needed").
export function localizedPath(path: string, locale: Locale): string {
  return locale === defaultLocale ? path : `/${locale}${path}`;
}

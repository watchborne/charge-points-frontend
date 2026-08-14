import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "./locale";

// URL-based locale routing (replaces the old cookie-only resolution): the
// locale is now part of the route itself (`[locale]` segment), which lets
// Next.js statically generate and CDN-cache marketing pages again — a
// `cookies()` read in getRequestConfig forced every route to render
// dynamically (see i18n/request.ts's git history).
//
// localeDetection is off on purpose: on, next-intl redirects a visitor to
// their Accept-Language-inferred locale on first visit — bad for SEO
// (crawlers don't send a consistent Accept-Language, and redirect-based
// content negotiation reads as cloaking). Locale is decided explicitly
// instead: the URL prefix, the persisted NEXT_LOCALE cookie once picked via
// the footer's LocaleSwitcher, and defaultLocale otherwise.
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeDetection: false,
});

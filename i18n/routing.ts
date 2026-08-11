import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "./locale";

// URL-based locale routing (replaces the old cookie-only resolution): the
// locale is now part of the route itself (`[locale]` segment), which is what
// lets Next.js statically generate and CDN-cache marketing pages again — a
// `cookies()` read in getRequestConfig forced every route to render
// dynamically on every request (see i18n/request.ts's git history).
//
// localeDetection is off on purpose: with it on, next-intl redirects a
// visitor to their Accept-Language-inferred locale on first visit, which is
// exactly the kind of per-visitor-varying redirect that's bad for SEO
// (crawlers don't send a consistent Accept-Language, and content negotiation
// via redirects reads as cloaking). Locale is decided explicitly instead: the
// URL prefix, the persisted NEXT_LOCALE cookie once a visitor has picked one
// via the footer's LocaleSwitcher, and defaultLocale otherwise.
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeDetection: false,
});

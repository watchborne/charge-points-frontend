import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "./locale";

// The locale is part of the URL (`[locale]` segment), so pages can be
// statically generated: a `cookies()` read would make every route dynamic.
//
// localeDetection is off: an Accept-Language redirect on first visit hurts
// SEO (crawlers send no consistent Accept-Language, and it reads as
// cloaking). The locale is the URL prefix, else the NEXT_LOCALE cookie set by
// LocaleSwitcher, else defaultLocale.
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeDetection: false,
});

import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

export { defaultLocale, type Locale } from "./locale";

// `requestLocale` comes from the `[locale]` route segment (via the middleware
// rewrite), not from a cookie/header read — that's what keeps this static-
// generation-eligible (see i18n/routing.ts for why that matters).
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

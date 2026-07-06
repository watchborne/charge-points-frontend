import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import { defaultLocale, type Locale } from "./locale";

export { defaultLocale, localeForHost, type Locale } from "./locale";

const locales: readonly Locale[] = ["fr", "en"];

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  const locale =
    localeCookie && (locales as readonly string[]).includes(localeCookie)
      ? (localeCookie as Locale)
      : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

import { useLocale } from "next-intl";

import { redirect } from "@/i18n/navigation";

export default function NotFound() {
  const locale = useLocale();
  redirect({ href: "/app/404", locale });
}

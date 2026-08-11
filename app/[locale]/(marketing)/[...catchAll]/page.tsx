import { useLocale } from "next-intl";

import { redirect } from "@/i18n/navigation";

export default function CatchAll() {
  const locale = useLocale();
  redirect({ href: "/404", locale });
}

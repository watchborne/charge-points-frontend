import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/locale";

import { NotFoundContent } from "../../../components/NotFoundContent";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NotFoundPage({ params }: Props) {
  const { locale } = await params;
  // Required in this page too, not just the layout — see app/[locale]/(marketing)/page.tsx.
  setRequestLocale(locale as Locale);

  return <NotFoundContent />;
}

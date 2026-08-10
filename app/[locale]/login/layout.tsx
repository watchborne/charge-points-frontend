import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import "../../globals.css";

import { ToastNotification } from "@/app/components/ToastNotification/ToastNotification";
import type { Locale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";

import { Footer } from "../(marketing)/layout/Footer";

// See app/(marketing)/layout.tsx for why there's no `runtime = "edge"` here.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  title: "Watchborne - Login",
  description: "Log in to Watchborne app",
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale as Locale);

  return (
    <>
      <NextIntlClientProvider>
        <main className="max-w-7xl">
          <div className="min-h-screen lg:grid lg:grid-cols-2">{children}</div>
        </main>

        <Footer />
        <ToastNotification />
      </NextIntlClientProvider>
    </>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ThemeProvider } from "@/app/components/ThemeProvider";
import type { Locale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";

import { Footer } from "./layout/Footer";
import { Navbar } from "./layout/Navbar";

import "../../globals.css";

const inter = Inter({ subsets: ["latin"] });

// No `runtime = "edge"`: Next.js rejects it with generateStaticParams, and
// these pages are fully static.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  title: "Watchborne - Homepage",
  description: "Your monitoring system for EV charge points",
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
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <NextIntlClientProvider>
            <Navbar />
            {children}
            <Footer />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ThemeInitScript } from "@/app/components/ThemeInitScript";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import type { Locale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";

import { Footer } from "./layout/Footer";
import { Navbar } from "./layout/Navbar";

import "../../globals.css";

const inter = Inter({ subsets: ["latin"] });

// No `runtime = "edge"` here (Next.js rejects combining it with
// generateStaticParams below): these pages have no per-request dependency
// left now that locale comes from the URL, not a cookie (see
// i18n/routing.ts), so they're fully static — served straight from the CDN,
// which beats edge runtime anyway (zero function invocation at all, vs. a
// fast one).
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

  // Enables static rendering for this locale (next-intl requires this be
  // called before any translation hook runs in a statically-eligible tree).
  setRequestLocale(locale as Locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
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

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ThemeInitScript } from "@/app/components/ThemeInitScript";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import type { Locale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";

import "../../globals.css";

import { Footer } from "../(marketing)/layout/Footer";
import { Navbar } from "../(marketing)/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

// Unlike the other root layouts, no `runtime = "edge"` here: this route has
// no dynamic dependency at all (no auth, no locale-cookie-dependent data),
// so it's fully static — Next.js doesn't allow combining `generateStaticParams`
// with an edge runtime declaration on this route, and static beats edge
// anyway (a static page is served straight from the CDN, no function
// invocation at all).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  title: "Watchborne - Page Not Found",
  description: "This page could not be found",
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

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import "../../globals.css";
import { QueryProvider } from "@/app/app/providers/QueryProvider";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { ToastNotification } from "@/app/components/ToastNotification/ToastNotification";
import type { Locale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";

import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { WebSocketDataProvider } from "./hooks/useWebSocketContext";

const inter = Inter({ subsets: ["latin"] });

// No `runtime = "edge"` here either (see app/(marketing)/layout.tsx): even
// though /app/* is auth-gated, the gate itself runs in middleware, before
// this layout/page ever renders — unauthenticated visitors are redirected
// there and never reach this tree. The rendered shell has no per-request
// data of its own (real charge-point/site data is fetched client-side, see
// app/[locale]/app/hooks/useChargePoints.ts), so it's safe and correct for
// it to be static too — served straight from the CDN for every signed-in
// visitor, exactly like the marketing pages.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Web Push notification-channel epic (#403): PWA installability, mainly for
// iOS — Web Push only works there once the dashboard is added to the home
// screen (see app/[locale]/app/profile/page.tsx's push toggle, #401). The
// manifest/icons below have no effect on Desktop/Android, which already
// receive push in a plain tab (#400).
export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  title: "Watchborne - App",
  description: "Monitoring dashboard for EV charge points",
  appleWebApp: {
    // No native Apple title/icon override: this repo has one manifest name
    // ("Watchborne") and one icon set already, and duplicating either here
    // would just be a second place for the two to drift apart.
    capable: true,
    statusBarStyle: "default",
  },
};

// Split from `metadata` since Next 14: themeColor/colorScheme moved to a
// dedicated `viewport` export. #031B4E matches manifest.json's theme_color —
// this is what colors the iOS status bar / Android's browser chrome once
// installed.
export const viewport: Viewport = {
  themeColor: "#031B4E",
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
          <QueryProvider>
            <WebSocketDataProvider>
              <NextIntlClientProvider>
                <div className="flex min-h-screen flex-col bg-muted/30">
                  <Header />
                  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
                    {children}
                  </main>
                  <Footer />
                </div>
                <ToastNotification />
              </NextIntlClientProvider>
            </WebSocketDataProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

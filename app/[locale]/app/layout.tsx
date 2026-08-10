import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import "../../globals.css";
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

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  title: "Watchborne - App",
  description: "Monitoring dashboard for EV charge points",
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
    <html lang={locale}>
      <body className={inter.className}>
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
      </body>
    </html>
  );
}

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

// No `runtime = "edge"`: the auth gate runs in proxy.ts before this renders,
// and data is fetched client-side, so the shell is static.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// PWA installability: iOS only delivers Web Push to a dashboard added to the
// home screen.
export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  title: "Watchborne - App",
  description: "Monitoring dashboard for EV charge points",
  appleWebApp: {
    // No Apple-specific title/icon: the manifest's name and icons are reused.
    capable: true,
    statusBarStyle: "default",
  },
};

// #031B4E matches manifest.json's theme_color (status bar and browser chrome
// once installed).
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

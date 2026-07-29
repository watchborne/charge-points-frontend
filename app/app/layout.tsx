import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";

import "../globals.css";
import { ToastNotification } from "@/app/components/ToastNotification/ToastNotification";

import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { WebSocketDataProvider } from "./hooks/useWebSocketContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  title: "Watchborne - App",
  description: "Monitoring dashboard for EV charge points",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
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

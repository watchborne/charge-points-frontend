import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";

import "../globals.css";
import { ToastNotification } from "@/app/components/ToastNotification/ToastNotification";

import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { WebSocketDataProvider } from "./hooks/useWebSocketContext";

// See app/(marketing)/layout.tsx for why this is set on every root layout:
// the cookie-based locale (i18n/request.ts) forces dynamic rendering, and
// edge runtime avoids Node.js serverless cold starts for that dynamic render.
export const runtime = "edge";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  title: "Watchborne - App",
  description: "Monitoring dashboard for EV charge points",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
    </>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";

import "../globals.css";
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
            <div className="min-h-screen bg-background">
              <Header />
              {children}
            </div>
          </NextIntlClientProvider>
        </WebSocketDataProvider>
      </body>
    </html>
  );
}

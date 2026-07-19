import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";

import { ToastNotification } from "@/app/components/ToastNotification/ToastNotification";

import { Footer } from "../(marketing)/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  title: "Watchborne - Sign up",
  description: "Sign up for the Watchborne Alpha",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <NextIntlClientProvider>
          <main className="max-w-7xl">
            <div className="min-h-screen lg:grid lg:grid-cols-2">{children}</div>
          </main>

          <Footer />
          <ToastNotification />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

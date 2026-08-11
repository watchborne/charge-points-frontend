import type { Metadata } from "next";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";

import { ToastNotification } from "@/app/components/ToastNotification/ToastNotification";

import { Footer } from "../(marketing)/layout/Footer";

// See app/(marketing)/layout.tsx for why this is set on every root layout.
export const runtime = "edge";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  title: "Watchborne - Login",
  description: "Log in to Watchborne app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextIntlClientProvider>
        <main className="max-w-7xl">
          <div className="min-h-screen lg:grid lg:grid-cols-2">{children}</div>
        </main>

        <Footer />
        <ToastNotification />
      </NextIntlClientProvider>
    </>
  );
}

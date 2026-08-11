import type { Metadata } from "next";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";

import { Footer } from "../(marketing)/layout/Footer";
import { Navbar } from "../(marketing)/layout/Navbar";

// See app/(marketing)/layout.tsx for why this is set on every root layout.
export const runtime = "edge";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  title: "Watchborne - Page Not Found",
  description: "This page could not be found",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextIntlClientProvider>
        <Navbar />
        {children}
        <Footer />
      </NextIntlClientProvider>
    </>
  );
}

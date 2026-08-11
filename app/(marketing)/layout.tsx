import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";

import { Footer } from "./layout/Footer";
import { Navbar } from "./layout/Navbar";

import "rootApp/globals.css";

// The locale comes from a cookie (see i18n/request.ts), which is a Next
// "dynamic" API and opts every page under this layout out of static
// generation — each navigation is server-rendered on demand. Edge runtime
// keeps that (no URL restructuring needed to make locale static) while
// avoiding Node.js serverless cold starts, which is what was actually
// making production navigations slow.
export const runtime = "edge";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  title: "Watchborne - Homepage",
  description: "Your monitoring system for EV charge points",
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

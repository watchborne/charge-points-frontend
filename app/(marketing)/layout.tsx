import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

import { Footer } from "react-day-picker";
import { Navbar } from "./layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  title: "Watchborne - Homepage",
  description: "Your monitoring system for EV charge points",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Navbar />

        {children}

        <Footer />
      </body>
    </html>
  );
}

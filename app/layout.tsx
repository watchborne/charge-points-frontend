import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WebSocketDataProvider } from "./hooks/useWebSocketContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Charge points monitor",
  description: "Monitoring dashboard for EV charge points",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <WebSocketDataProvider>{children}</WebSocketDataProvider>
      </body>
    </html>
  );
}

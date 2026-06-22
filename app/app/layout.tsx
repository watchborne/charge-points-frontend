import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { WebSocketDataProvider } from "./hooks/useWebSocketContext";
import { AuthProvider } from "./components/AuthProvider";

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
        <AuthProvider>
          <WebSocketDataProvider>{children}</WebSocketDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";

import { ThemeProvider } from "./components/ThemeProvider";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="fr">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

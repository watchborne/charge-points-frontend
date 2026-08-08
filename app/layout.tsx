import type { Metadata } from "next";

import { ThemeInitScript } from "./components/ThemeInitScript";
import { ThemeProvider } from "./components/ThemeProvider";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

"use client";

import type { Theme } from "@watchborne/electrons";
import React, { ReactNode, useEffect, useState } from "react";

const THEME_STORAGE_KEY = "theme-preference";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const applyTheme = (selectedTheme: Theme) => {
  const isDark =
    selectedTheme === "dark" ||
    (selectedTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const htmlElement = document.documentElement;
  if (isDark) {
    htmlElement.classList.add("dark");
  } else {
    htmlElement.classList.remove("dark");
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || "system";
    setTheme(stored);
    applyTheme(stored);
    setMounted(true);
  }, []);

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  // For tests and edge cases, return a default value instead of throwing
  if (!context) {
    return { theme: "light" as const, setTheme: () => {} };
  }
  return context;
};

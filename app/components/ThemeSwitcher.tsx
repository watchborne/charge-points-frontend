"use client";

import { Moon, Sun } from "lucide-react";

import type { Theme } from "./ThemeProvider";

export type ThemeSwitcherProps = {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
};

const THEMES: { theme: Theme; icon: React.ReactNode; label: string }[] = [
  { theme: "light", icon: <Sun className="h-4 w-4" />, label: "Light" },
  { theme: "dark", icon: <Moon className="h-4 w-4" />, label: "Dark" },
];

export const ThemeSwitcher = ({ currentTheme, onThemeChange }: ThemeSwitcherProps) => {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-muted p-1">
      {THEMES.map(({ theme, icon, label }) => (
        <button
          key={theme}
          onClick={() => onThemeChange(theme)}
          className={`inline-flex items-center justify-center rounded px-2 py-1.5 transition-colors ${
            currentTheme === theme
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label={`Switch to ${label} theme`}
          title={label}
        >
          {icon}
        </button>
      ))}
    </div>
  );
};

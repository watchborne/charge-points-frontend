import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect } from "vitest";

import { ThemeProvider, useTheme } from "../ThemeProvider";

const THEME_STORAGE_KEY = "theme-preference";

const Consumer = () => {
  const { theme, setTheme } = useTheme();
  return <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme}</button>;
};

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

afterEach(cleanup);

describe("ThemeProvider", () => {
  it("SHOULD default to light and skip the dark class WHEN localStorage is empty", () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    expect(screen.getByRole("button").textContent).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("SHOULD restore the stored theme and apply the dark class WHEN localStorage has 'dark'", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    expect(screen.getByRole("button").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("SHOULD persist the new theme to localStorage WHEN setTheme is called", () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByRole("button").textContent).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});

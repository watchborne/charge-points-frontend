import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClient, signOut, getUser } = vi.hoisted(() => ({
  createBrowserClient: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/pricing",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      appName: "Watchborne",
      "layout.navbar.navigation.features": "Features",
      "layout.navbar.navigation.pricing": "Pricing",
      "layout.navbar.navigation.contact": "Contact",
      "layout.navbar.actions.login": "Login",
      "layout.navbar.actions.logout": "Logout",
      "layout.navbar.actions.dashboard": "Go to dashboard",
      "layout.navbar.actions.requestAlphaAccess": "Request Alpha Access",
      "layout.navbar.actions.menu": "Menu",
    };
    return translations[key] ?? key;
  },
}));

import { Navbar } from "../Navbar";

beforeEach(() => {
  signOut.mockReset().mockResolvedValue({ error: null });
  getUser.mockReset();
  createBrowserClient.mockReturnValue({ auth: { getUser, signOut } });
});

afterEach(() => {
  cleanup();
});

describe("Navbar", () => {
  it("SHOULD show login and request alpha access buttons WHEN the user is not authenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    render(<Navbar />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /login/i })).toBeTruthy();
      expect(screen.getByRole("link", { name: /request alpha access/i })).toBeTruthy();
      expect(screen.queryByRole("button", { name: /logout/i })).toBeNull();
    });
  });

  it("SHOULD show the dashboard and logout buttons WHEN the user is authenticated", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });

    render(<Navbar />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /dashboard/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /logout/i })).toBeTruthy();
      expect(screen.queryByRole("link", { name: /login/i })).toBeNull();
      expect(screen.queryByRole("link", { name: /request alpha access/i })).toBeNull();
    });
  });
});

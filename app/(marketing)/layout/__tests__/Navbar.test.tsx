import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClient, signOut } = vi.hoisted(() => {
  const signOut = vi.fn();
  return {
    signOut,
    createBrowserClient: vi.fn(() => ({ auth: { signOut, getUser: vi.fn() } })),
  };
});

const { replace, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      appName: "Watchborne",
      "layout.navbar.navigation.pricing": "Pricing",
      "layout.navbar.navigation.contact": "Contact",
      "layout.navbar.actions.login": "Login",
      "layout.navbar.actions.logout": "Logout",
      "layout.navbar.actions.requestAlphaAccess": "Request Alpha Access",
    };
    return translations[key] || key;
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      appName: "Watchborne",
      "layout.navbar.navigation.pricing": "Pricing",
      "layout.navbar.navigation.contact": "Contact",
      "layout.navbar.actions.login": "Login",
      "layout.navbar.actions.logout": "Logout",
      "layout.navbar.actions.requestAlphaAccess": "Request Alpha Access",
    };
    return translations[key] || key;
  },
}));

import { Navbar } from "../Navbar";

beforeEach(() => {
  signOut.mockReset().mockResolvedValue({ error: null });
  replace.mockReset();
  refresh.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("Navbar", () => {
  it("shows login and request alpha access buttons when user is not authenticated", async () => {
    createBrowserClient.mockReturnValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        signOut,
      },
    });

    render(<Navbar />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /login/i })).toBeTruthy();
      expect(screen.getByRole("link", { name: /request alpha access/i })).toBeTruthy();
      expect(screen.queryByRole("button", { name: /logout/i })).toBeNull();
    });
  });

  it("shows logout button when user is authenticated", async () => {
    createBrowserClient.mockReturnValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
        signOut,
      },
    });

    render(<Navbar />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /logout/i })).toBeTruthy();
      expect(screen.queryByRole("link", { name: /login/i })).toBeNull();
      expect(screen.queryByRole("link", { name: /request alpha access/i })).toBeNull();
    });
  });

  it("signs the user out and redirects to /login when logout is clicked", async () => {
    createBrowserClient.mockReturnValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
        signOut,
      },
    });

    render(<Navbar />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /logout/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => expect(signOut).toHaveBeenCalled());
    expect(replace).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalled();
  });
});

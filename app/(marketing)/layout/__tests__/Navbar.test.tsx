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
      "layout.navbar.actions.menu": "Menu",
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

  it("SHOULD reveal the mobile navigation panel WHEN the menu toggle is clicked", async () => {
    createBrowserClient.mockReturnValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        signOut,
      },
    });

    render(<Navbar />);

    expect(screen.queryAllByRole("link", { name: /pricing/i })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /menu/i }));

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: /pricing/i })).toHaveLength(2);
    });
  });

  it("SHOULD close the mobile navigation panel WHEN a nav link is clicked", async () => {
    createBrowserClient.mockReturnValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        signOut,
      },
    });

    render(<Navbar />);

    fireEvent.click(screen.getByRole("button", { name: /menu/i }));

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: /pricing/i })).toHaveLength(2);
    });

    const mobileLinks = screen.getAllByRole("link", { name: /pricing/i });
    fireEvent.click(mobileLinks[mobileLinks.length - 1]);

    await waitFor(() => {
      expect(screen.queryAllByRole("link", { name: /pricing/i })).toHaveLength(1);
    });
  });
});

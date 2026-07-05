import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const { createBrowserClient, signOut } = vi.hoisted(() => {
  const signOut = vi.fn();
  return {
    signOut,
    createBrowserClient: vi.fn(() => ({ auth: { signOut } })),
  };
});

const { replace, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/dashboard",
  useRouter: () => ({ replace, refresh }),
}));

vi.mock("../../hooks/useWebSocket", () => ({
  useWebSocket: () => ({ status: "CONNECTED" }),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      appName: "Watchborne",
      "layout.navbar.app.links.sites": "Sites",
      "layout.navbar.app.links.chargePoints": "Charge Points",
      "layout.navbar.app.connectionStatus": "Connection Status",
      "layout.navbar.actions.logout": "Logout",
    };
    return translations[key] || key;
  },
}));

import { Header } from "../Header";

beforeEach(() => {
  signOut.mockReset().mockResolvedValue({ error: null });
  replace.mockReset();
  refresh.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("Header", () => {
  it("renders the header with navigation links and logout button", async () => {
    render(<Header />);

    // Wait for component to fully render
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /sites/i })).toBeTruthy();
      expect(screen.getByRole("link", { name: /charge points/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /logout/i })).toBeTruthy();
    });
  });

  it("signs the user out and redirects to /login when logout is clicked", async () => {
    render(<Header />);

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => expect(signOut).toHaveBeenCalled());
    expect(replace).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalled();
  });

  it("displays WebSocket connection status", async () => {
    render(<Header />);

    await waitFor(() => {
      expect(screen.getByText(/connection status/i)).toBeTruthy();
    });
  });
});

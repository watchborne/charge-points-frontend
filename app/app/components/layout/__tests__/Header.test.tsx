import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Header } from "../Header";

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

vi.mock("../../../hooks/useWebSocket", () => ({
  useWebSocket: () => ({ status: "CONNECTED" }),
}));

vi.mock("next-intl", () => {
  const translations: Record<string, string> = {
    appName: "Watchborne",
    "layout.navbar.app.links.sites": "Sites",
    "layout.navbar.app.links.chargePoints": "Charge Points",
    "layout.navbar.actions.logout": "Logout",
    "layout.navbar.actions.menu": "Menu",
  };
  return {
    useTranslations: () => (key: string) => translations[key] || key,
  };
});

const renderComponent = () => render(<Header />);

const CONNECTED_ICON_CLASS = "lucide-circle-check-big";

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
    renderComponent();

    expect(screen.getByRole("link", { name: /sites/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /charge points/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /logout/i })).toBeTruthy();
  });

  it("signs the user out and redirects to the homepage when logout is clicked", async () => {
    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => expect(signOut).toHaveBeenCalled());
    expect(replace).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalled();
  });

  it("displays WebSocket connection status", async () => {
    const { container } = renderComponent();

    expect(container.querySelector(`svg.${CONNECTED_ICON_CLASS}`)).toBeTruthy();
  });
});

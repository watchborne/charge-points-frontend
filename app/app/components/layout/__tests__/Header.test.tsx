import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WebSocketStatus } from "../../../ws/ws-manager";
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

const { useWebSocket } = vi.hoisted(() => ({
  useWebSocket: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/dashboard",
  useRouter: () => ({ replace, refresh }),
}));

vi.mock("../../../hooks/useWebSocket", () => ({ useWebSocket }));

vi.mock("next-intl", () => {
  const translations: Record<string, string> = {
    appName: "Watchborne",
    "layout.navbar.app.links.sites": "Sites",
    "layout.navbar.app.links.chargePoints": "Charge Points",
    "layout.navbar.actions.logout": "Logout",
    "layout.navbar.actions.menu": "Menu",
    "layout.navbar.app.wsStatus.connecting": "Connecting…",
    "layout.navbar.app.wsStatus.connected": "Connected",
    "layout.navbar.app.wsStatus.disconnected": "Disconnected",
    "layout.navbar.app.wsStatus.error": "Connection error",
  };
  return {
    useTranslations: () => (key: string) => translations[key] ?? key,
  };
});

const renderComponent = () => render(<Header />);

const setWebSocketStatus = (status: WebSocketStatus) => useWebSocket.mockReturnValue({ status });

beforeEach(() => {
  signOut.mockReset().mockResolvedValue({ error: null });
  replace.mockReset();
  refresh.mockReset();
  useWebSocket.mockReset();
  setWebSocketStatus("CONNECTED");
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

  describe("WebSocket connection status", () => {
    it.each([
      ["CONNECTING", "Connecting…"],
      ["CONNECTED", "Connected"],
      ["DISCONNECTED", "Disconnected"],
      ["ERROR", "Connection error"],
    ] satisfies [WebSocketStatus, string][])(
      "SHOULD expose an accessible status icon WHEN the WebSocket status is %s",
      (status, accessibleName) => {
        setWebSocketStatus(status);

        renderComponent();

        expect(screen.getByRole("img", { name: accessibleName })).toBeTruthy();
      },
    );
  });
});

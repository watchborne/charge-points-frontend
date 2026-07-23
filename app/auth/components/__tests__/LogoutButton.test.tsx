import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClient, signOut } = vi.hoisted(() => {
  const signOut = vi.fn();
  return {
    signOut,
    createBrowserClient: vi.fn(() => ({ auth: { signOut } })),
  };
});

vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "layout.navbar.actions.logout": "Logout",
    };
    return translations[key] ?? key;
  },
}));

import { LogoutButton } from "../LogoutButton";

const assign = vi.fn();
const originalLocation = window.location;

beforeEach(() => {
  signOut.mockReset().mockResolvedValue({ error: null });
  assign.mockReset();
  // jsdom's window.location.assign can't be spied on directly, so swap in a
  // stub that records the navigation target.
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...originalLocation, assign },
  });
});

afterEach(() => {
  cleanup();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});

describe("LogoutButton", () => {
  it("SHOULD sign the user out and hard-reload to the homepage WHEN clicked", async () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => expect(signOut).toHaveBeenCalled());
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/"));
  });

  it("SHOULD disable the button WHILE logging out", async () => {
    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: /logout/i }) as HTMLButtonElement;
    fireEvent.click(button);

    expect(button.disabled).toBe(true);

    await waitFor(() => expect(signOut).toHaveBeenCalled());
  });
});

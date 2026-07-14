import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  useRouter: () => ({ replace, refresh }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "layout.navbar.actions.logout": "Logout",
    };
    return translations[key] || key;
  },
}));

import { LogoutButton } from "../LogoutButton";

beforeEach(() => {
  signOut.mockReset().mockResolvedValue({ error: null });
  replace.mockReset();
  refresh.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("LogoutButton", () => {
  it("SHOULD sign the user out and redirect to the homepage WHEN clicked", async () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => expect(signOut).toHaveBeenCalled());
    expect(replace).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalled();
  });

  it("SHOULD disable the button WHILE logging out", async () => {
    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: /logout/i }) as HTMLButtonElement;
    fireEvent.click(button);

    expect(button.disabled).toBe(true);

    await waitFor(() => expect(signOut).toHaveBeenCalled());
  });
});

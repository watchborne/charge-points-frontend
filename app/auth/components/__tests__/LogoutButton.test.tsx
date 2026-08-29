import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClient, signOut } = vi.hoisted(() => {
  const signOut = vi.fn();
  return {
    signOut,
    createBrowserClient: vi.fn(() => ({ auth: { signOut } })),
  };
});

const { push } = vi.hoisted(() => {
  return { push: vi.fn() };
});

vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

vi.mock("next-intl/navigation", () => ({
  createNavigation: () => ({
    useRouter: () => ({
      push,
    }),
    Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
      <a href={href}>{children}</a>
    ),
    usePathname: () => "/",
    redirect: vi.fn(),
    getPathname: vi.fn(),
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

import { LogoutButton } from "../LogoutButton";

beforeEach(() => {
  signOut.mockReset().mockResolvedValue({ error: null });
  push.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("LogoutButton", () => {
  it("SHOULD sign the user out and hard-reload to the homepage WHEN clicked", async () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => expect(signOut).toHaveBeenCalled());
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });

  it("SHOULD disable the button WHILE logging out", async () => {
    render(<LogoutButton />);

    const button = screen.getByRole("button", {
      name: "layout.navbar.actions.logout",
    }) as HTMLButtonElement;
    fireEvent.click(button);

    expect(button.disabled).toBe(true);

    await waitFor(() => expect(signOut).toHaveBeenCalled());
  });
});

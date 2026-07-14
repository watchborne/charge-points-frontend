import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn(() => "/pricing"),
}));

vi.mock("next/navigation", () => ({ usePathname }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      appName: "Watchborne",
      "layout.navbar.actions.menu": "Menu",
    };
    return translations[key] || key;
  },
}));

import { Navbar, NavbarLink } from "../Navbar";

const links: NavbarLink[] = [
  { key: "pricing", label: "Pricing", url: "/pricing" },
  { key: "contact", label: "Contact", url: "/contact" },
];

beforeEach(() => {
  usePathname.mockReturnValue("/pricing");
});

afterEach(() => {
  cleanup();
});

describe("Navbar", () => {
  it("SHOULD link the logo to the home page WHEN the current path is not under /app/", () => {
    render(<Navbar links={links} />);

    expect(screen.getByRole("link", { name: "Watchborne" }).getAttribute("href")).toBe("/");
  });

  it("SHOULD link the logo to the dashboard WHEN the current path is under /app/", () => {
    usePathname.mockReturnValue("/app/sites");

    render(<Navbar links={links} />);

    expect(screen.getByRole("link", { name: "Watchborne" }).getAttribute("href")).toBe(
      "/app/dashboard",
    );
  });

  it("SHOULD highlight the link matching the current path", () => {
    usePathname.mockReturnValue("/contact");

    render(<Navbar links={links} />);

    expect(screen.getByRole("link", { name: "Contact" }).className).toContain("bg-charge-soft");
    expect(screen.getByRole("link", { name: "Pricing" }).className).not.toContain("bg-charge-soft");
  });

  it("SHOULD render children WHEN provided", () => {
    render(
      <Navbar links={links}>
        <button>Log out</button>
      </Navbar>,
    );

    expect(screen.getByRole("button", { name: "Log out" })).toBeTruthy();
  });

  it("SHOULD reveal the mobile navigation panel WHEN the menu toggle is clicked", () => {
    render(<Navbar links={links} />);

    expect(screen.getAllByRole("link", { name: "Pricing" })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /menu/i }));

    expect(screen.getAllByRole("link", { name: "Pricing" })).toHaveLength(2);
  });

  it("SHOULD close the mobile navigation panel WHEN a nav link is clicked", () => {
    render(<Navbar links={links} />);

    fireEvent.click(screen.getByRole("button", { name: /menu/i }));
    expect(screen.getAllByRole("link", { name: "Pricing" })).toHaveLength(2);

    const mobileLinks = screen.getAllByRole("link", { name: "Pricing" });
    fireEvent.click(mobileLinks[mobileLinks.length - 1]);

    expect(screen.getAllByRole("link", { name: "Pricing" })).toHaveLength(1);
  });
});

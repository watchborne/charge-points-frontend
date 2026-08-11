import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === "layout.footer.copyright") return `© ${values?.year} Watchborne`;
    if (key === "layout.footer.sections.company.links.contact") return "Contact";
    return key;
  },
}));

vi.mock("../../../../../../i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string | { pathname: string };
    children?: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={typeof href === "string" ? href : href.pathname} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("../../../../../components/layout/LocaleSwitcher", () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher" />,
}));

import { Footer } from "../Footer";

afterEach(() => {
  cleanup();
});

describe("Footer", () => {
  it("SHOULD render the copyright notice, a contact link, and the locale switcher", () => {
    render(<Footer />);

    expect(screen.getByText(`© ${new Date().getFullYear()} Watchborne`)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Contact" }).getAttribute("href")).toBe("/contact");
    expect(screen.getByTestId("locale-switcher")).toBeTruthy();
  });
});

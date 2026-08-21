import { cleanup, render, screen } from "@testing-library/react";
import type { Site, SiteHealth } from "@watchborne/charge-points-types";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/en/app/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next-intl/navigation", () => ({
  createNavigation: () => ({
    Link: vi.fn(),
    redirect: vi.fn(),
    usePathname: () => "/en/app/dashboard",
    useRouter: () => ({ push: vi.fn() }),
    getPathname: vi.fn(),
  }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: vi.fn(),
  redirect: vi.fn(),
  usePathname: () => "/en/app/dashboard",
  useRouter: () => ({ push: vi.fn() }),
  getPathname: vi.fn(),
}));

import { SiteHealthSection } from "../SiteHealthSection";

const site = (id: string, name: string): Site =>
  ({
    id,
    name,
    customer: "LVMH",
    customerId: "c-1",
    installedAt: new Date(),
    lastVisitedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }) as Site;

const health = (siteId: string, overrides: Partial<SiteHealth> = {}): SiteHealth => ({
  siteId,
  chargePointsTotal: 4,
  chargePointsOnline: 4,
  chargePointsWarning: 0,
  chargePointsOffline: 0,
  status: "HEALTHY",
  ...overrides,
});

afterEach(() => cleanup());

describe("SiteHealthSection", () => {
  it("SHOULD render nothing WHEN there is no matching site/health pair", () => {
    const { container } = render(
      <SiteHealthSection sites={[site("1", "Paris")]} sitesHealth={[health("2")]} />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("SHOULD join sites and their health by siteId, dropping unmatched entries", () => {
    render(
      <SiteHealthSection
        sites={[site("1", "Paris"), site("2", "Lyon")]}
        sitesHealth={[health("1", { status: "CRITICAL" }), health("3", { status: "CRITICAL" })]}
      />,
    );

    // Paris (id "1") has a matching health entry and renders — in both the
    // watchlist and the full list, since it's CRITICAL. Lyon (id "2") has no
    // health entry and is dropped; the health entry for the unknown site "3"
    // is dropped too.
    expect(screen.getAllByText("Paris").length).toBeGreaterThan(0);
    expect(screen.queryByText("Lyon")).toBeNull();
  });
});

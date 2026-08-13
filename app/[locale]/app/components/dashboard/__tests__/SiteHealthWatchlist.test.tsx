import { cleanup, render, screen } from "@testing-library/react";
import type { Site, SiteHealth } from "@watchborne/charge-points-types";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

import { SiteHealthWatchlist } from "../SiteHealthWatchlist";

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

const health = (overrides: Partial<SiteHealth> = {}): SiteHealth => ({
  siteId: "s",
  chargePointsTotal: 4,
  chargePointsOnline: 4,
  chargePointsWarning: 0,
  chargePointsOffline: 0,
  status: "HEALTHY",
  ...overrides,
});

afterEach(() => cleanup());

describe("SiteHealthWatchlist", () => {
  it("SHOULD show the empty state WHEN every site is healthy", () => {
    render(
      <SiteHealthWatchlist
        sitesWithHealth={[{ site: site("1", "Paris"), health: health({ status: "HEALTHY" }) }]}
      />,
    );

    expect(screen.getByText("appPage.dashboard.siteHealth.watchlist.empty")).toBeTruthy();
  });

  it("SHOULD list only non-HEALTHY sites, worst first", () => {
    render(
      <SiteHealthWatchlist
        sitesWithHealth={[
          { site: site("1", "Paris"), health: health({ status: "HEALTHY" }) },
          {
            site: site("2", "Lyon"),
            health: health({ status: "DEGRADED", chargePointsWarning: 1, chargePointsOnline: 1 }),
          },
          {
            site: site("3", "Nantes"),
            health: health({ status: "CRITICAL", chargePointsOffline: 4, chargePointsOnline: 0 }),
          },
        ]}
      />,
    );

    expect(screen.queryByText("Paris")).toBeNull();
    const names = screen.getAllByRole("listitem").map((item) => item.textContent);
    // Nantes (CRITICAL) must be listed before Lyon (DEGRADED).
    expect(names[0]).toContain("Nantes");
    expect(names[1]).toContain("Lyon");
  });

  it("SHOULD cap the list at 3 sites, breaking severity ties by affected count", () => {
    const sitesWithHealth = [
      { site: site("1", "A"), health: health({ status: "DEGRADED", chargePointsWarning: 1 }) },
      { site: site("2", "B"), health: health({ status: "DEGRADED", chargePointsWarning: 3 }) },
      { site: site("3", "C"), health: health({ status: "DEGRADED", chargePointsWarning: 2 }) },
      { site: site("4", "D"), health: health({ status: "DEGRADED", chargePointsWarning: 4 }) },
    ];

    render(<SiteHealthWatchlist sitesWithHealth={sitesWithHealth} />);

    const names = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(names).toHaveLength(3);
    // Most affected (D=4, B=3, C=2) first; A (1) drops off.
    expect(names[0]).toContain("D");
    expect(names[1]).toContain("B");
    expect(names[2]).toContain("C");
  });
});

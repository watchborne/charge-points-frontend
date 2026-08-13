import { cleanup, render, screen } from "@testing-library/react";
import type { Site, SiteHealth } from "@watchborne/charge-points-types";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { SiteHealthList } from "../SiteHealthList";

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
  chargePointsOnline: 3,
  chargePointsWarning: 1,
  chargePointsOffline: 0,
  status: "HEALTHY",
  ...overrides,
});

afterEach(() => cleanup());

describe("SiteHealthList", () => {
  it("SHOULD render one row per site with its online/warning/offline counts", () => {
    render(
      <SiteHealthList
        sitesWithHealth={[
          {
            site: site("1", "Paris"),
            health: health({
              chargePointsOnline: 3,
              chargePointsWarning: 1,
              chargePointsOffline: 0,
            }),
          },
          {
            site: site("2", "Lyon"),
            health: health({
              status: "CRITICAL",
              chargePointsOnline: 0,
              chargePointsWarning: 0,
              chargePointsOffline: 2,
            }),
          },
        ]}
      />,
    );

    const parisRow = screen.getByText("Paris").closest("tr");
    expect(parisRow?.textContent).toContain("3");
    expect(parisRow?.textContent).toContain("1");

    const lyonRow = screen.getByText("Lyon").closest("tr");
    expect(lyonRow?.textContent).toContain("2");
  });

  it("SHOULD render no rows WHEN there are no sites", () => {
    render(<SiteHealthList sitesWithHealth={[]} />);

    expect(screen.queryAllByRole("row")).toHaveLength(1); // header row only
  });
});

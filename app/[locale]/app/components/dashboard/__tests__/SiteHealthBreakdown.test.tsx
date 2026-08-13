import { cleanup, render, screen } from "@testing-library/react";
import type { SiteHealth } from "@watchborne/charge-points-types";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

import { SiteHealthBreakdown } from "../SiteHealthBreakdown";

const health = (overrides: Partial<SiteHealth> = {}): SiteHealth => ({
  siteId: "11111111-1111-4111-8111-111111111111",
  chargePointsTotal: 4,
  chargePointsOnline: 4,
  chargePointsWarning: 0,
  chargePointsOffline: 0,
  status: "HEALTHY",
  ...overrides,
});

const statValue = (title: string) =>
  screen.getByText(title).parentElement?.parentElement?.querySelector("p.text-2xl")?.textContent;

afterEach(() => cleanup());

describe("SiteHealthBreakdown", () => {
  it("SHOULD count sites per status", () => {
    render(
      <SiteHealthBreakdown
        sitesHealth={[
          health({ status: "HEALTHY" }),
          health({ status: "DEGRADED", chargePointsOnline: 2, chargePointsWarning: 2 }),
          health({ status: "CRITICAL", chargePointsOnline: 0, chargePointsOffline: 4 }),
        ]}
      />,
    );

    expect(statValue("appPage.dashboard.siteHealth.stats.total")).toBe("3");
    expect(statValue("appPage.dashboard.siteHealth.stats.healthy")).toBe("1");
    expect(statValue("appPage.dashboard.siteHealth.stats.degraded")).toBe("1");
    expect(statValue("appPage.dashboard.siteHealth.stats.critical")).toBe("1");
  });

  it("SHOULD sum offline and warning charge points across every site into the affected count", () => {
    render(
      <SiteHealthBreakdown
        sitesHealth={[
          health({ chargePointsOnline: 2, chargePointsWarning: 2, chargePointsOffline: 0 }),
          health({ chargePointsOnline: 0, chargePointsWarning: 0, chargePointsOffline: 4 }),
        ]}
      />,
    );

    expect(
      screen.getByText(
        `appPage.dashboard.siteHealth.affectedChargePoints:${JSON.stringify({ count: 6 })}`,
      ),
    ).toBeTruthy();
  });

  it("SHOULD report zero counts WHEN there are no sites", () => {
    render(<SiteHealthBreakdown sitesHealth={[]} />);

    expect(statValue("appPage.dashboard.siteHealth.stats.total")).toBe("0");
    expect(
      screen.getByText(
        `appPage.dashboard.siteHealth.affectedChargePoints:${JSON.stringify({ count: 0 })}`,
      ),
    ).toBeTruthy();
  });
});

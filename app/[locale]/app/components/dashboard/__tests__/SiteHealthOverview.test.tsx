import { cleanup, render, screen } from "@testing-library/react";
import type { SiteHealth } from "@watchborne/charge-points-types";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { SiteHealthOverview } from "../SiteHealthOverview";

const createSiteHealth = (overrides: Partial<SiteHealth> = {}): SiteHealth => ({
  siteId: "11111111-1111-4111-8111-111111111111",
  chargePointsTotal: 4,
  chargePointsOffline: 0,
  offlineRatio: 0,
  status: "HEALTHY",
  ...overrides,
});

afterEach(() => {
  cleanup();
});

describe("SiteHealthOverview", () => {
  it("SHOULD show the count of healthy sites out of the total, as a percentage", () => {
    render(
      <SiteHealthOverview
        sitesHealth={[
          createSiteHealth({ status: "HEALTHY" }),
          createSiteHealth({ status: "HEALTHY" }),
          createSiteHealth({ status: "DEGRADED" }),
          createSiteHealth({ status: "CRITICAL" }),
        ]}
      />,
    );

    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy();
  });

  it("SHOULD show 0% WHEN there are no sites", () => {
    render(<SiteHealthOverview sitesHealth={[]} />);

    expect(screen.getByText("0")).toBeTruthy();
    expect(screen.getByText("0%")).toBeTruthy();
  });

  it("SHOULD render WHEN every site is healthy", () => {
    render(
      <SiteHealthOverview
        sitesHealth={[
          createSiteHealth({ status: "HEALTHY" }),
          createSiteHealth({ status: "HEALTHY" }),
        ]}
      />,
    );

    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("100%")).toBeTruthy();
  });
});

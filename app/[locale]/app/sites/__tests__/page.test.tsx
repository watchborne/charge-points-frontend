import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { push, sitesResult, chargePointsResult } = vi.hoisted(() => {
  const site = {
    id: "site-1",
    name: "Paris",
    customer: "ACME",
    installedAt: new Date("2025-01-01"),
  };
  return {
    push: vi.fn(),
    sitesResult: { sites: [site], loading: false, error: null },
    chargePointsResult: { chargePoints: [] },
  };
});

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("../../../../../i18n/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../../hooks/useSites", () => ({ useSites: () => sitesResult }));
vi.mock("../../hooks/useChargePoints", () => ({ useChargePoints: () => chargePointsResult }));
vi.mock("../../components/sites/SiteStats", () => ({ SiteStats: () => null }));
vi.mock("../components/SiteGridSkeleton", () => ({ SiteGridSkeleton: () => null }));
vi.mock("../components/SiteFormDialog", () => ({ SiteFormDialog: () => null }));
vi.mock("../components/SiteGrid", () => ({
  SiteGrid: ({
    sites,
    onSiteClicked,
  }: {
    sites: (typeof sitesResult.sites)[number][];
    onSiteClicked: (s: (typeof sitesResult.sites)[number]) => void;
  }) => <button onClick={() => onSiteClicked(sites[0])}>open-site</button>,
}));

import SitesPage from "../page";

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe("SitesPage", () => {
  it("SHOULD navigate to the site detail page WHEN a site is clicked", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <SitesPage />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByText("open-site"));

    expect(push).toHaveBeenCalledWith("/app/sites/site-1");
  });
});

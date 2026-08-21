import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChargePointWithConnectors } from "@/types/charge-point";

const { useChargePoints, useSites, useSitesHealth } = vi.hoisted(() => ({
  useChargePoints: vi.fn(),
  useSites: vi.fn(),
  useSitesHealth: vi.fn(),
}));

// Relative targets throughout, not the "@/" alias: this project's Vitest
// config does not alias "@/" for the mock resolver, so an aliased vi.mock
// target silently fails to intercept (see TriggerMessageControl.test.tsx for
// the same convention).
vi.mock("../../hooks/useChargePoints", () => ({ useChargePoints }));
vi.mock("../../hooks/useSites", () => ({ useSites }));
vi.mock("../../hooks/useSitesHealth", () => ({ useSitesHealth }));
vi.mock("../../../../../i18n/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));

vi.mock("../../charge-points/components/CommissioningQueue", () => ({
  CommissioningQueue: ({ chargePoints }: { chargePoints: ChargePointWithConnectors[] }) => (
    <div data-testid="commissioning-queue">{chargePoints.map((cp) => cp.id).join(",")}</div>
  ),
}));
vi.mock("../../components/charge-points/ChargePointStatsSkeleton", () => ({
  ChargePointStatsSkeleton: () => <div data-testid="stats-skeleton" />,
}));
vi.mock("../../components/charge-points/ChargePointsBreakdown", () => ({
  ChargePointsBreakdown: () => <div data-testid="breakdown" />,
}));
vi.mock("../../components/dashboard/DashboardOnboarding", () => ({
  DashboardOnboarding: ({ hasSites }: { hasSites: boolean }) => (
    <div data-testid="onboarding">{hasSites ? "has-sites" : "no-sites"}</div>
  ),
}));
vi.mock("../../components/dashboard/FleetOverviewPanel", () => ({
  FleetOverviewPanel: () => <div data-testid="fleet-overview" />,
}));
vi.mock("../../components/dashboard/FleetOverviewPanelSkeleton", () => ({
  FleetOverviewPanelSkeleton: () => <div data-testid="fleet-overview-skeleton" />,
}));
vi.mock("../../components/dashboard/SiteHealthSection", () => ({
  SiteHealthSection: () => <div data-testid="site-health-section" />,
}));

import DashboardPage from "../page";

afterEach(() => cleanup());

const chargePoint = (id: string, commissionedAt: string | null): ChargePointWithConnectors =>
  ({
    id,
    ocppIdentity: `CP-${id}`,
    name: `CP-${id}`,
    siteId: null,
    isActive: true,
    commissionedAt,
    connection: { status: "SYNCED", lastSeenAt: new Date() },
    ocppVersion: "1.6",
    meta: {},
    connectors: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }) as ChargePointWithConnectors;

const setHooks = ({
  chargePoints = [],
  loadingChargePoints = false,
  errorChargePoints = null,
  sites = [],
  loadingSites = false,
  errorSites = null,
  sitesHealth = [],
  loadingSitesHealth = false,
  errorSitesHealth = null,
}: {
  chargePoints?: ChargePointWithConnectors[];
  loadingChargePoints?: boolean;
  errorChargePoints?: string | null;
  sites?: unknown[];
  loadingSites?: boolean;
  errorSites?: string | null;
  sitesHealth?: unknown[];
  loadingSitesHealth?: boolean;
  errorSitesHealth?: string | null;
}) => {
  useChargePoints.mockReturnValue({
    chargePoints,
    loading: loadingChargePoints,
    error: errorChargePoints,
    refetch: vi.fn(),
  });
  useSites.mockReturnValue({
    sites,
    loading: loadingSites,
    error: errorSites,
    refetch: vi.fn(),
  });
  useSitesHealth.mockReturnValue({
    sitesHealth,
    loading: loadingSitesHealth,
    error: errorSitesHealth,
    refetch: vi.fn(),
  });
};

beforeEach(() => {
  useChargePoints.mockReset();
  useSites.mockReset();
  useSitesHealth.mockReset();
});

describe("DashboardPage", () => {
  it("SHOULD show skeletons WHEN any of the three reads is still loading", () => {
    setHooks({ loadingChargePoints: true });

    render(<DashboardPage />);

    expect(screen.getByTestId("stats-skeleton")).toBeTruthy();
    expect(screen.getByTestId("fleet-overview-skeleton")).toBeTruthy();
    expect(screen.queryByTestId("fleet-overview")).toBeNull();
  });

  it("SHOULD show an error callout per failed read WHEN any read errors", () => {
    setHooks({ errorChargePoints: "Could not load charge points" });

    render(<DashboardPage />);

    expect(screen.getByText("Could not load charge points")).toBeTruthy();
  });

  it("SHOULD show onboarding WHEN there are no charge points", () => {
    setHooks({ chargePoints: [], sites: [] });

    render(<DashboardPage />);

    expect(screen.getByTestId("onboarding")).toHaveProperty("textContent", "no-sites");
    expect(screen.queryByTestId("fleet-overview")).toBeNull();
  });

  it("SHOULD show the fleet overview panel WHEN there are charge points", () => {
    setHooks({ chargePoints: [chargePoint("cp-1", "2024-01-01T00:00:00.000Z")] });

    render(<DashboardPage />);

    expect(screen.getByTestId("fleet-overview")).toBeTruthy();
    expect(screen.queryByTestId("onboarding")).toBeNull();
  });

  it("SHOULD only pass charge points awaiting commissioning to the commissioning queue", () => {
    setHooks({
      chargePoints: [
        chargePoint("cp-commissioned", "2024-01-01T00:00:00.000Z"),
        chargePoint("cp-awaiting", null),
      ],
    });

    render(<DashboardPage />);

    expect(screen.getByTestId("commissioning-queue")).toHaveProperty("textContent", "cp-awaiting");
  });
});

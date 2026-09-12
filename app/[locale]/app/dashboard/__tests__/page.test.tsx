import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChargePointWithConnectors } from "@/types/charge-point";

const { useChargePoints, useSites, useDashboardLayout } = vi.hoisted(() => ({
  useChargePoints: vi.fn(),
  useSites: vi.fn(),
  useDashboardLayout: vi.fn(),
}));

// Relative targets throughout, not the "@/" alias: this project's Vitest
// config does not alias "@/" for the mock resolver, so an aliased vi.mock
// target silently fails to intercept (see TriggerMessageControl.test.tsx for
// the same convention).
vi.mock("../../hooks/useChargePoints", () => ({ useChargePoints }));
vi.mock("../../hooks/useSites", () => ({ useSites }));
vi.mock("../../hooks/useDashboardLayout", () => ({ useDashboardLayout }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
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

// Relative, not the "@/" alias: same resolver limitation as the mock targets
// above, but for a real (non-type) import rather than a vi.mock target.
import {
  DashboardWidgetPreference,
  defaultDashboardLayout,
} from "../../../../../lib/dashboard-layout";
import DashboardPage from "../page";

afterEach(() => cleanup());

// `awaitingCommissioning` drives the fields `isAwaitingCommissioning` (lib/commissioning.ts)
// actually reads — no site and still named after the raw `ocppIdentity` — rather than
// `commissionedAt`, which a commissioning-token self-claim now sets before a station has
// either (charge-points-server's ClaimChargePointWithTokenCommandHandler).
const chargePoint = (
  id: string,
  { awaitingCommissioning = false }: { awaitingCommissioning?: boolean } = {},
): ChargePointWithConnectors =>
  ({
    id,
    ocppIdentity: `ocpp-${id}`,
    name: awaitingCommissioning ? `ocpp-${id}` : `CP-${id}`,
    siteId: awaitingCommissioning ? null : "site-1",
    isActive: true,
    commissionedAt: "2024-01-01T00:00:00.000Z",
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
  layout = defaultDashboardLayout(),
}: {
  chargePoints?: ChargePointWithConnectors[];
  loadingChargePoints?: boolean;
  errorChargePoints?: string | null;
  sites?: unknown[];
  loadingSites?: boolean;
  errorSites?: string | null;
  layout?: DashboardWidgetPreference[];
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
  useDashboardLayout.mockReturnValue({
    layout,
    toggleVisibility: vi.fn(),
    moveWidget: vi.fn(),
    resetLayout: vi.fn(),
  });
};

beforeEach(() => {
  useChargePoints.mockReset();
  useSites.mockReset();
  useDashboardLayout.mockReset();
});

describe("DashboardPage", () => {
  it("SHOULD show skeletons WHEN either of the two reads is still loading", () => {
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
    setHooks({ chargePoints: [chargePoint("cp-1")] });

    render(<DashboardPage />);

    expect(screen.getByTestId("fleet-overview")).toBeTruthy();
    expect(screen.queryByTestId("onboarding")).toBeNull();
  });

  it("SHOULD only pass charge points awaiting commissioning to the commissioning queue", () => {
    setHooks({
      chargePoints: [
        chargePoint("cp-commissioned"),
        chargePoint("cp-awaiting", { awaitingCommissioning: true }),
      ],
    });

    render(<DashboardPage />);

    expect(screen.getByTestId("commissioning-queue")).toHaveProperty("textContent", "cp-awaiting");
  });

  it("SHOULD hide a widget WHEN its layout preference marks it not visible", () => {
    setHooks({
      chargePoints: [chargePoint("cp-1")],
      layout: [
        { id: "siteHealth", visible: false },
        { id: "chargePointsBreakdown", visible: true },
        { id: "fleetOverview", visible: true },
      ],
    });

    render(<DashboardPage />);

    expect(screen.queryByTestId("site-health-section")).toBeNull();
    expect(screen.getByTestId("breakdown")).toBeTruthy();
    expect(screen.getByTestId("fleet-overview")).toBeTruthy();
  });

  it("SHOULD render visible widgets in the order given by the layout preference", () => {
    setHooks({
      chargePoints: [chargePoint("cp-1")],
      layout: [
        { id: "fleetOverview", visible: true },
        { id: "siteHealth", visible: true },
        { id: "chargePointsBreakdown", visible: true },
      ],
    });

    render(<DashboardPage />);

    const order = screen
      .getAllByTestId(/^(site-health-section|breakdown|fleet-overview)$/)
      .map((el) => el.getAttribute("data-testid"));

    expect(order).toEqual(["fleet-overview", "site-health-section", "breakdown"]);
  });

  it("SHOULD open the layout customization dialog WHEN the customize button is clicked", () => {
    setHooks({});

    render(<DashboardPage />);
    fireEvent.click(screen.getByText("appPage.dashboard.layout.customize"));

    expect(screen.getByText("appPage.dashboard.layout.dialogTitle")).toBeTruthy();
  });
});

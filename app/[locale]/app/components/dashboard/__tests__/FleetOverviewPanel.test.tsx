import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Site } from "@watchborne/charge-points-types";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChargePointWithConnectors } from "@/types/charge-point";

const push = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Relative path, not the "@/" alias: this project's Vitest config does not
// alias "@/" for the mock resolver, so an aliased vi.mock target silently
// fails to intercept (see dashboard/__tests__/page.test.tsx for the same
// convention) — and this test actually asserts on the navigation call.
vi.mock("../../../../../../i18n/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { FleetOverviewPanel } from "../FleetOverviewPanel";

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

const chargePoint = (
  id: string,
  overrides: Partial<ChargePointWithConnectors> = {},
): ChargePointWithConnectors =>
  ({
    id,
    name: `CP-${id}`,
    siteId: null,
    isActive: true,
    commissionedAt: "2024-01-01T00:00:00.000Z",
    connection: { status: "SYNCED", lastSeenAt: null },
    ocppVersion: "1.6",
    meta: {},
    connectors: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as ChargePointWithConnectors;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FleetOverviewPanel", () => {
  it("SHOULD navigate to the charge point's page WHEN its redirect icon is clicked", () => {
    render(<FleetOverviewPanel chargePoints={[chargePoint("cp-1")]} sites={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "appPage.dashboard.viewChargePoint" }));

    expect(push).toHaveBeenCalledWith("/app/charge-points?id=cp-1");
  });

  it("SHOULD NOT expand the row's inline details WHEN the redirect icon is clicked", () => {
    render(<FleetOverviewPanel chargePoints={[chargePoint("cp-1")]} sites={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "appPage.dashboard.viewChargePoint" }));

    expect(screen.queryByText("appPage.dashboard.uptime")).toBeNull();
  });

  it("SHOULD still toggle the row's inline details WHEN the row itself is clicked", () => {
    render(<FleetOverviewPanel chargePoints={[chargePoint("cp-1")]} sites={[]} />);

    fireEvent.click(screen.getByText("CP-cp-1"));

    expect(screen.getByText("appPage.dashboard.uptime")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  it("SHOULD link to a different charge point's page per row", () => {
    render(
      <FleetOverviewPanel
        chargePoints={[chargePoint("cp-1"), chargePoint("cp-2")]}
        sites={[site("s-1", "Paris")]}
      />,
    );

    const [firstIcon, secondIcon] = screen.getAllByRole("button", {
      name: "appPage.dashboard.viewChargePoint",
    });

    fireEvent.click(secondIcon);
    expect(push).toHaveBeenCalledWith("/app/charge-points?id=cp-2");

    fireEvent.click(firstIcon);
    expect(push).toHaveBeenCalledWith("/app/charge-points?id=cp-1");
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import type { Site } from "@watchborne/charge-points-types";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChargePointWithConnectors } from "@/types/charge-point";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      "appPage.sites.page.table.empty": "No sites yet",
      "appPage.sites.page.table.columns.actions": "Actions",
      "appPage.sites.page.card.chargePointsWithCount": `${values?.count ?? ""} charge points`,
      "appPage.sites.page.table.columns.installDate": "Installed",
      "appPage.sites.page.table.columns.lastVisit": "Last visit",
    };
    return map[key] ?? key;
  },
  useFormatter: () => ({
    dateTime: (date: Date) => date.toISOString().slice(0, 10),
  }),
}));

import { SiteGrid } from "../SiteGrid";

afterEach(() => cleanup());

const site = (id: string, name: string): Site =>
  ({
    id,
    name,
    customer: "LVMH",
    customerId: "c-1",
    installedAt: new Date("2024-01-15T00:00:00.000Z"),
    lastVisitedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }) as Site;

const chargePoint = (id: string, siteId: string): ChargePointWithConnectors =>
  ({
    id,
    ocppIdentity: `CP-${id}`,
    name: `CP-${id}`,
    siteId,
    isActive: true,
    connection: { status: "SYNCED", lastSeenAt: new Date() },
    ocppVersion: "1.6",
    meta: {},
    connectors: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }) as ChargePointWithConnectors;

describe("SiteGrid", () => {
  it("SHOULD show the empty state WHEN there are no sites", () => {
    render(
      <SiteGrid sites={[]} chargePoints={[]} onEditClicked={vi.fn()} onDeleteClicked={vi.fn()} />,
    );

    expect(screen.getByText("No sites yet")).toBeTruthy();
  });

  it("SHOULD render one card per site", () => {
    render(
      <SiteGrid
        sites={[site("s-1", "Paris"), site("s-2", "Lyon")]}
        chargePoints={[]}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    expect(screen.getByText("Paris")).toBeTruthy();
    expect(screen.getByText("Lyon")).toBeTruthy();
  });

  it("SHOULD only pass a site its own charge points, filtered by siteId", () => {
    render(
      <SiteGrid
        sites={[site("s-1", "Paris"), site("s-2", "Lyon")]}
        chargePoints={[chargePoint("cp-1", "s-1"), chargePoint("cp-2", "s-2")]}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    expect(screen.getAllByText("1 charge points").length).toBe(2);
  });
});
